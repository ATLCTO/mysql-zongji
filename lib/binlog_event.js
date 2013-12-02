var util = require('util');

// from http://stackoverflow.com/questions/17687307/convert-a-64bit-little-endian-integer-to-number
function readUInt64(buff, offset) {
  return buff.readInt32LE(offset) + 0x100000000 * buff.readUInt32LE(offset + 4);
}

function BinlogEvent(buffer, typeCode, timestamp, nextPosition, size) {
  this.buffer = buffer;
  this.typeCode = typeCode;
  this.timestamp = timestamp;
  this.nextPosition = nextPosition;
  this.size = size;
}

BinlogEvent.prototype.getEventName = function() {
  return this.getTypeName().toLowerCase();
};

BinlogEvent.prototype.getTypeName = function() {
  return this.constructor.name;
};

BinlogEvent.prototype.getTypeCode = function() {
  return this.typeCode;
};

BinlogEvent.prototype.dump = function() {
  console.log("=== %s ===", this.getTypeName());
  console.log("Date: %s", new Date(this.timestamp));
  console.log("Next log position: %d", this.nextPosition);
  console.log("Event size:", this.size);
  console.log("Type code:", this.getTypeCode());
  console.log("Buffer:", this.buffer);
};

// Change MySQL bin log file
// Attributes:
//     position: Position inside next binlog
//     binlogName: Name of next binlog file
function Rotate(buffer, typeCode, timestamp, nextPosition, size) {
  if (this instanceof Rotate) {
    BinlogEvent.apply(this, arguments);
    this.position = readUInt64(this.buffer, 0);
    this.binlogName = this.buffer.toString('ascii', 8);
  }
  else {
    return new Rotate(buffer, typeCode, timestamp, nextPosition, size);
  }
}
util.inherits(Rotate, BinlogEvent);

Rotate.prototype.dump = function() {
  console.log("=== %s ===", this.getTypeName());
  console.log("Event size: %d", (this.size));
  console.log("Position: %d", this.position);
  console.log("Next binlog file: %s", this.binlogName);
};

function Format(buffer, typeCode, timestamp, nextPosition, size) {
  if (this instanceof Format) {
    BinlogEvent.apply(this, arguments);
  }
  else {
    return new Format(buffer, typeCode, timestamp, nextPosition, size);
  }
}
util.inherits(Format, BinlogEvent);

// A COMMIT event
// Attributes:
//     xid: Transaction ID for 2PC
function Xid(buffer, typeCode, timestamp, nextPosition, size) {
  if (this instanceof Xid) {
    BinlogEvent.apply(this, arguments);

    this.xid = readUInt64(this.buffer, 0);
  }
  else {
    return new Xid(buffer, typeCode, timestamp, nextPosition, size);
  }
}
util.inherits(Xid, BinlogEvent);

// This evenement is trigger when a query is run of the database.
// Only replicated queries are logged.
function Query(buffer, typeCode, timestamp, nextPosition, size) {
  if (this instanceof Query) {
    BinlogEvent.apply(this, arguments);
  }
  else {
    return new Query(buffer, typeCode, timestamp, nextPosition, size);
  }
}
util.inherits(Query, BinlogEvent);

function Unknown(buffer, typeCode, timestamp, nextPosition, size) {
  if (this instanceof Unknown) {
    BinlogEvent.apply(this, arguments);
  }
  else {
    return new Unknown(buffer, typeCode, timestamp, nextPosition, size);
  }
}
util.inherits(Unknown, BinlogEvent);

exports.Rotate = Rotate;
exports.Format = Format;
exports.Query = Query;
exports.Xid = Xid;
exports.Unknown = Unknown;