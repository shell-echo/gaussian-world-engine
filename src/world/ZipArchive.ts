const LOCAL_FILE_SIGNATURE = 0x04034b50;
const CENTRAL_FILE_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const DEFLATE_METHOD = 8;
const MAX_ENTRIES = 1024;
const MAX_ENTRY_BYTES = 256 * 1024 * 1024;
const MAX_TOTAL_BYTES = 512 * 1024 * 1024;

export interface ZipEntryInput {
  name: string;
  data: Uint8Array;
  modifiedAt?: Date;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
  method: number;
  crc32: number;
}

interface CentralRecord {
  nameBytes: Uint8Array;
  crc: number;
  size: number;
  offset: number;
  dosTime: number;
  dosDate: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const crcTable = createCrcTable();

export function createZip(entries: readonly ZipEntryInput[]): Uint8Array {
  if (entries.length === 0) throw new Error("ZIP archive needs at least one entry.");
  if (entries.length > MAX_ENTRIES) throw new Error(`ZIP archive exceeds ${MAX_ENTRIES} entries.`);

  const localParts: Uint8Array[] = [];
  const centralRecords: CentralRecord[] = [];
  const names = new Set<string>();
  let localOffset = 0;
  let totalBytes = 0;

  for (const entry of entries) {
    const name = normalizeEntryName(entry.name);
    if (names.has(name)) throw new Error(`Duplicate ZIP entry: ${name}`);
    names.add(name);
    if (entry.data.byteLength > MAX_ENTRY_BYTES) {
      throw new Error(`ZIP entry ${name} exceeds ${formatBytes(MAX_ENTRY_BYTES)}.`);
    }
    totalBytes += entry.data.byteLength;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(`ZIP archive exceeds ${formatBytes(MAX_TOTAL_BYTES)}.`);
    }

    const nameBytes = textEncoder.encode(name);
    const crc = crc32(entry.data);
    const { dosDate, dosTime } = toDosDateTime(entry.modifiedAt ?? new Date());
    const header = new Uint8Array(30 + nameBytes.byteLength);
    const view = new DataView(header.buffer);
    writeUint32(view, 0, LOCAL_FILE_SIGNATURE);
    writeUint16(view, 4, 20);
    writeUint16(view, 6, UTF8_FLAG);
    writeUint16(view, 8, STORE_METHOD);
    writeUint16(view, 10, dosTime);
    writeUint16(view, 12, dosDate);
    writeUint32(view, 14, crc);
    writeUint32(view, 18, entry.data.byteLength);
    writeUint32(view, 22, entry.data.byteLength);
    writeUint16(view, 26, nameBytes.byteLength);
    writeUint16(view, 28, 0);
    header.set(nameBytes, 30);

    localParts.push(header, entry.data);
    centralRecords.push({
      nameBytes,
      crc,
      size: entry.data.byteLength,
      offset: localOffset,
      dosTime,
      dosDate,
    });
    localOffset += header.byteLength + entry.data.byteLength;
  }

  const centralParts: Uint8Array[] = [];
  let centralSize = 0;
  for (const record of centralRecords) {
    const header = new Uint8Array(46 + record.nameBytes.byteLength);
    const view = new DataView(header.buffer);
    writeUint32(view, 0, CENTRAL_FILE_SIGNATURE);
    writeUint16(view, 4, 20);
    writeUint16(view, 6, 20);
    writeUint16(view, 8, UTF8_FLAG);
    writeUint16(view, 10, STORE_METHOD);
    writeUint16(view, 12, record.dosTime);
    writeUint16(view, 14, record.dosDate);
    writeUint32(view, 16, record.crc);
    writeUint32(view, 20, record.size);
    writeUint32(view, 24, record.size);
    writeUint16(view, 28, record.nameBytes.byteLength);
    writeUint16(view, 30, 0);
    writeUint16(view, 32, 0);
    writeUint16(view, 34, 0);
    writeUint16(view, 36, 0);
    writeUint32(view, 38, 0);
    writeUint32(view, 42, record.offset);
    header.set(record.nameBytes, 46);
    centralParts.push(header);
    centralSize += header.byteLength;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, localOffset);
  writeUint16(endView, 20, 0);

  return concatBytes([...localParts, ...centralParts, end]);
}

export async function readZip(input: ArrayBuffer | Uint8Array): Promise<Map<string, ZipEntry>> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = findEndOfCentralDirectory(view);
  const diskNumber = readUint16(view, endOffset + 4);
  const centralDisk = readUint16(view, endOffset + 6);
  if (diskNumber !== 0 || centralDisk !== 0) {
    throw new Error("Multi-disk ZIP archives are not supported.");
  }

  const entriesOnDisk = readUint16(view, endOffset + 8);
  const entryCount = readUint16(view, endOffset + 10);
  const centralSize = readUint32(view, endOffset + 12);
  const centralOffset = readUint32(view, endOffset + 16);
  if (entriesOnDisk !== entryCount) throw new Error("Invalid ZIP central directory.");
  if (entryCount > MAX_ENTRIES) throw new Error(`ZIP archive exceeds ${MAX_ENTRIES} entries.`);
  if (centralOffset + centralSize > bytes.byteLength) throw new Error("ZIP central directory is truncated.");

  const entries = new Map<string, ZipEntry>();
  let offset = centralOffset;
  let totalBytes = 0;

  for (let index = 0; index < entryCount; index += 1) {
    ensureRange(bytes, offset, 46, "ZIP central entry");
    if (readUint32(view, offset) !== CENTRAL_FILE_SIGNATURE) {
      throw new Error("Invalid ZIP central entry signature.");
    }

    const flags = readUint16(view, offset + 8);
    const method = readUint16(view, offset + 10);
    const expectedCrc = readUint32(view, offset + 16);
    const compressedSize = readUint32(view, offset + 20);
    const uncompressedSize = readUint32(view, offset + 24);
    const nameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const localOffset = readUint32(view, offset + 42);
    ensureRange(bytes, offset + 46, nameLength + extraLength + commentLength, "ZIP entry metadata");

    if ((flags & 0x0001) !== 0) throw new Error("Encrypted ZIP entries are not supported.");
    if (method !== STORE_METHOD && method !== DEFLATE_METHOD) {
      throw new Error(`Unsupported ZIP compression method: ${method}.`);
    }
    if (uncompressedSize > MAX_ENTRY_BYTES) {
      throw new Error(`ZIP entry exceeds ${formatBytes(MAX_ENTRY_BYTES)}.`);
    }
    totalBytes += uncompressedSize;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(`ZIP archive expands beyond ${formatBytes(MAX_TOTAL_BYTES)}.`);
    }

    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    const name = normalizeEntryName(textDecoder.decode(nameBytes));
    if (entries.has(name)) throw new Error(`Duplicate ZIP entry: ${name}`);

    ensureRange(bytes, localOffset, 30, "ZIP local entry");
    if (readUint32(view, localOffset) !== LOCAL_FILE_SIGNATURE) {
      throw new Error(`Invalid local ZIP header for ${name}.`);
    }
    const localNameLength = readUint16(view, localOffset + 26);
    const localExtraLength = readUint16(view, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    ensureRange(bytes, dataOffset, compressedSize, `ZIP data for ${name}`);
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    const data = method === STORE_METHOD ? compressed : await inflateRaw(compressed);

    if (data.byteLength !== uncompressedSize) {
      throw new Error(`ZIP entry ${name} has an invalid uncompressed size.`);
    }
    const actualCrc = crc32(data);
    if (actualCrc !== expectedCrc) throw new Error(`ZIP entry ${name} failed CRC validation.`);

    if (!name.endsWith("/")) {
      entries.set(name, { name, data, method, crc32: actualCrc });
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ (crcTable[(crc ^ byte) & 0xff] ?? 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot read compressed ZIP entries.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(
    new DecompressionStream("deflate-raw" as CompressionFormat),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (readUint32(view, offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) return offset;
  }
  throw new Error("ZIP end-of-central-directory record was not found.");
}

function normalizeEntryName(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  const segments = normalized.split("/");
  if (
    !normalized ||
    normalized.includes("\0") ||
    segments.some((segment) => segment === ".." || segment === ".")
  ) {
    throw new Error(`Unsafe ZIP entry path: ${value}`);
  }
  return normalized;
}

function toDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  return { dosDate, dosTime };
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function ensureRange(bytes: Uint8Array, offset: number, length: number, label: string): void {
  if (offset < 0 || length < 0 || offset + length > bytes.byteLength) {
    throw new Error(`${label} is truncated.`);
  }
}

function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function formatBytes(value: number): string {
  if (value < 1024 ** 2) return `${Math.ceil(value / 1024)} KB`;
  return `${Math.ceil(value / 1024 ** 2)} MB`;
}
