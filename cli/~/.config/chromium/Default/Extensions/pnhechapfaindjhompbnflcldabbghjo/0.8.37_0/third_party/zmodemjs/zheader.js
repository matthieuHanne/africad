//----------------------------------------------------------------------
// Header classes

( function() {
"use strict";

const ZDLE_CHAR = String.fromCharCode(Zmodem.ZMLIB.ZDLE);

//"**" + ZDLE_CHAR + "B";
const HEX_HEADER_PREFIX = [ 0x2a, 0x2a, Zmodem.ZMLIB.ZDLE, 0x42 ];

//NB: lrzsz uses \x8a rather than \x0a where the specs
//say to use LF. For simplicity, we avoid that and just use
//the 7-bit LF character.
const HEX_HEADER_CRLF = [ 0x0d, 0x0a ];
const HEX_HEADER_CRLF_XON = HEX_HEADER_CRLF.slice(0).concat( [Zmodem.ZMLIB.XON] );

const BINARY16_HEADER_PREFIX = [ 0x2a, Zmodem.ZMLIB.ZDLE, 0x41 ];
const BINARY32_HEADER_PREFIX = [ 0x2a, Zmodem.ZMLIB.ZDLE, 0x43 ];

/** Class that represents a ZMODEM header. */
Zmodem.Header = class ZmodemHeader {

    /**
     * Parse out a Header object from a given array of octet values.
     *
     * An exception is thrown if the given bytes are definitively invalid
     * as header values.
     *
     * @param {Array} octets - The octet values to parse.
     *      Each array member should be an 8-bit unsigned integer (0-255).
     *      This object is mutated in the function.
     *
     * @returns {Header|undefined} An instance of the appropriate Header
     *      subclass, or undefined if not enough octet values are given
     *      to determine whether there is a valid header here or not.
     */
    static parse(octets) {
        var hdr;
        if (octets[1] === 42) {  //'*'
            hdr = _parse_hex(octets);
            return hdr && [ hdr, 16 ];
        }

        else if (octets[2] === 65) {  //'A'
            hdr = _parse_binary16(octets, 3);
            return hdr && [ hdr, 16 ];
        }

        else if (octets[2] === 67) {  //'C'
            hdr = _parse_binary32(octets);
            return hdr && [ hdr, 32 ];
        }

        if (octets.length < 3) return;

        throw( "Unrecognized/unsupported octets: " + octets.join() );
    }

    /**
     * Build a Header subclass given a name and arguments.
     *
     * @param {string} name - The header type name, e.g., “ZRINIT”.
     *
     * @param {...*} args - The arguments to pass to the appropriate
     *      subclass constructor.
     *
     * @returns {Header} - An instance of the appropriate Header subclass.
     */
    static build(name /*, args */) {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

        //TODO: make this better
        var Ctr = FRAME_NAME_CREATOR[name];
        if (!Ctr) throw("No frame class “" + name + "” is defined!");

        args.shift();

        //Plegh!
        //https://stackoverflow.com/questions/33193310/constr-applythis-args-in-es6-classes
        var hdr = new (Ctr.bind.apply(Ctr, [null].concat(args)));

        return hdr;
    }

    /**
     * Return the octet values array that represents the object
     * in ZMODEM hex encoding.
     *
     * @returns {Array} - An array of octet values suitable for sending
     *      as binary data.
     */
    to_hex() {
        var to_crc = this._crc_bytes();

        return HEX_HEADER_PREFIX.concat(
            Zmodem.ENCODELIB.octets_to_hex( to_crc.concat( Zmodem.CRC.crc16(to_crc) ) ),
            this._hex_header_ending
        );
    }

    /**
     * Return the octet values array that represents the object
     * in ZMODEM binary encoding with a 16-bit CRC.
     *
     * @param {ZDLE} zencoder - A ZDLE instance to use for
     *      ZDLE encoding.
     *
     * @returns {Array} - An array of octet values suitable for sending
     *      as binary data.
     */
    to_binary16(zencoder) {
        return this._to_binary(zencoder, BINARY16_HEADER_PREFIX, Zmodem.CRC.crc16);
    }

    /**
     * Return the octet values array that represents the object
     * in ZMODEM binary encoding with a 32-bit CRC.
     *
     * @param {ZDLE} zencoder - A ZDLE instance to use for
     *      ZDLE encoding.
     *
     * @returns {Array} - An array of octet values suitable for sending
     *      as binary data.
     */
    to_binary32(zencoder) {
        return this._to_binary(zencoder, BINARY32_HEADER_PREFIX, Zmodem.CRC.crc32);
    }

    //This is never called directly, but only as super().
    constructor() {
        if (!this._bytes4) {
            this._bytes4 = [0, 0, 0, 0];
        }
    }

    _to_binary(zencoder, prefix, crc_func) {
        var to_crc = this._crc_bytes();

        //Both the 4-byte payload and the CRC bytes are ZDLE-encoded.
        var octets = prefix.concat(
            zencoder.encode( to_crc.concat( crc_func(to_crc) ) )
        );

        return octets;
    }

    _crc_bytes() {
        return [ this.TYPENUM ].concat(this._bytes4);
    }
}
Zmodem.Header.prototype._hex_header_ending = HEX_HEADER_CRLF_XON;

class ZRQINIT_HEADER extends Zmodem.Header {};

//----------------------------------------------------------------------

const ZRINIT_FLAG = {

    //----------------------------------------------------------------------
    // Bit Masks for ZRINIT flags byte ZF0
    //----------------------------------------------------------------------
    CANFDX: 0x01,  // Rx can send and receive true FDX
    CANOVIO: 0x02, // Rx can receive data during disk I/O
    CANBRK: 0x04,  // Rx can send a break signal
    CANCRY: 0x08,  // Receiver can decrypt -- nothing does this
    CANLZW: 0x10,  // Receiver can uncompress -- nothing does this
    CANFC32: 0x20, // Receiver can use 32 bit Frame Check
    ESCCTL: 0x40,  // Receiver expects ctl chars to be escaped
    ESC8: 0x80,    // Receiver expects 8th bit to be escaped
};

function _get_ZRINIT_flag_num(fl) {
    if (!ZRINIT_FLAG[fl]) {
        throw("Invalid ZRINIT flag: " + fl);
    }
    return ZRINIT_FLAG[fl];
}

class ZRINIT_HEADER extends Zmodem.Header {
    constructor(flags_arr, bufsize) {
        super();
        var flags_num = 0;
        if (!bufsize) bufsize = 0;

        flags_arr.forEach( function(fl) {
            flags_num |= _get_ZRINIT_flag_num(fl);
        } );

        this._bytes4 = [
            bufsize & 0xff,
            bufsize >> 8,
            0,
            flags_num,
        ];
    }

    //undefined if nonstop I/O is allowed
    get_buffer_size() {
        return Zmodem.ENCODELIB.unpack_u16_be( this._bytes4.slice(0, 2) ) || undefined;
    }

    //Unimplemented:
    //  can_decrypt
    //  can_decompress

    //----------------------------------------------------------------------
    //function names taken from Jacques Mattheij’s implementation,
    //as used in syncterm.

    can_full_duplex() {
        return !!( this._bytes4[3] & ZRINIT_FLAG.CANFDX );
    }

    can_overlap_io() {
        return !!( this._bytes4[3] & ZRINIT_FLAG.CANOVIO );
    }

    can_break() {
        return !!( this._bytes4[3] & ZRINIT_FLAG.CANBRK );
    }

    can_fcs_32() {
        return !!( this._bytes4[3] & ZRINIT_FLAG.CANFC32 );
    }

    escape_ctrl_chars() {
        return !!( this._bytes4[3] & ZRINIT_FLAG.ESCCTL );
    }

    //Is this used? I don’t see it used in lrzsz or syncterm
    //Looks like it was a “foreseen” feature that Forsberg
    //never implemented. (The need for it went away, maybe?)
    escape_8th_bit() {
        return !!( this._bytes4[3] & ZRINIT_FLAG.ESC8 );
    }
};

//----------------------------------------------------------------------

//Since context makes clear what’s going on, we use these
//rather than the T-prefixed constants in the specification.
var ZSINIT_FLAG = {
    ESCCTL: 0x40,  // Transmitter will escape ctl chars
    ESC8: 0x80,    // Transmitter will escape 8th bit
};

function _get_ZSINIT_flag_num(fl) {
    if (!ZSINIT_FLAG[fl]) {
        throw("Invalid ZSINIT flag: " + fl);
    }
    return ZSINIT_FLAG[fl];
}

class ZSINIT_HEADER extends Zmodem.Header {
    constructor( flags_arr, attn_seq_arr ) {
        super();
        var flags_num = 0;

        flags_arr.forEach( function(fl) {
            flags_num |= _get_ZSINIT_flag_num(fl);
        } );

        this._bytes4 = [ 0, 0, 0, flags_num ];

        if (attn_seq_arr) {
            if (attn_seq_arr.length > 31) {
                throw("Attn sequence must be <= 31 bytes");
            }
            if (attn_seq_arr.some( function(num) { return num > 255 } )) {
                throw("Attn sequence (" + attn_seq_arr + ") must be <256");
            }
            this._data = attn_seq_arr.concat([0]);
        }
    }

    escape_ctrl_chars() {
        return !!( this._bytes4[3] & ZSINIT_FLAG.ESCCTL );
    }

    //Is this used? I don’t see it used in lrzsz or syncterm
    escape_8th_bit() {
        return !!( this._bytes4[3] & ZSINIT_FLAG.ESC8 );
    }
}

//Thus far it doesn’t seem we really need this header except to respond
//to ZSINIT, which doesn’t require a payload.
class ZACK_HEADER extends Zmodem.Header {
    constructor(payload4) {
        super();

        if (payload4) {
            this._bytes4 = payload4.slice();
        }
    }
}
ZACK_HEADER.prototype._hex_header_ending = HEX_HEADER_CRLF;

//no options allowed here.
class ZFILE_HEADER extends Zmodem.Header {

    constructor(opts) {
        super();
        this._bytes4 = [ 0, 0, 0, 0 ];

        //TODO: we gotta be able to parse these .. :-/
        /*
        if (opts.conversion) {
            var conv_num = ZFILE_CONVERSION[ opts.conversion ];
            if (!conv_num) throw( "Unknown conversion: " + opts.conversion );
            this._bytes4[3] = conv_num;
        }

        if (opts.management) {
            var mgmt_num = ZFILE_MANAGEMENT[ opts.management ];
            if (!mgmt_num) throw( "Unknown management: " + opts.management );
            this._bytes4[2] = mgmt_num;
        }

        if (opts.management_require_local) {
            this._bytes4[2] |= 0x80;    // ZMSKNOLOC
        */
    }
}

//Empty headers - in addition to ZRQINIT
class ZSKIP_HEADER extends Zmodem.Header {}
//No need for ZNAK
class ZABORT_HEADER extends Zmodem.Header {}
class ZFIN_HEADER extends Zmodem.Header {}
class ZFERR_HEADER extends Zmodem.Header {}

ZFIN_HEADER.prototype._hex_header_ending = HEX_HEADER_CRLF;

class ZOffsetHeader extends Zmodem.Header {
    constructor(offset) {
        super();
        this._bytes4 = Zmodem.ENCODELIB.pack_u32_le(offset);
    }

    get_offset() {
        return Zmodem.ENCODELIB.unpack_u32_le(this._bytes4);
    }
}

class ZRPOS_HEADER extends ZOffsetHeader {};
class ZDATA_HEADER extends ZOffsetHeader {};
class ZEOF_HEADER extends ZOffsetHeader {};

//As request, receiver creates.
/* UNIMPLEMENTED FOR NOW
class ZCRC_HEADER extends ZHeader {
    constructor(crc_le_bytes) {
        super();
        if (crc_le_bytes) {  //response, sender creates
            this._bytes4 = crc_le_bytes;
        }
    }
}
*/

//No ZCHALLENGE implementation

//class ZCOMPL_HEADER extends ZHeader {}
//class ZCAN_HEADER extends Zmodem.Header {}

//As described, this header represents an information disclosure.
//It could be interpreted, I suppose, merely as “this is how much space
//I have FOR YOU.”
//TODO: implement if needed/requested
//class ZFREECNT_HEADER extends ZmodemHeader {}

//----------------------------------------------------------------------

const FRAME_CLASS_TYPES = [
    [ ZRQINIT_HEADER, "ZRQINIT" ],
    [ ZRINIT_HEADER, "ZRINIT" ],
    [ ZSINIT_HEADER, "ZSINIT" ],
    [ ZACK_HEADER, "ZACK" ],
    [ ZFILE_HEADER, "ZFILE" ],
    [ ZSKIP_HEADER, "ZSKIP" ],
    undefined, // [ ZNAK_HEADER, "ZNAK" ],
    [ ZABORT_HEADER, "ZABORT" ],
    [ ZFIN_HEADER, "ZFIN" ],
    [ ZRPOS_HEADER, "ZRPOS" ],
    [ ZDATA_HEADER, "ZDATA" ],
    [ ZEOF_HEADER, "ZEOF" ],
    [ ZFERR_HEADER, "ZFERR" ],  //see note
    undefined, //[ ZCRC_HEADER, "ZCRC" ],
    undefined, //[ ZCHALLENGE_HEADER, "ZCHALLENGE" ],
    undefined, //[ ZCOMPL_HEADER, "ZCOMPL" ],
    undefined, //[ ZCAN_HEADER, "ZCAN" ],
    undefined, //[ ZFREECNT_HEADER, "ZFREECNT" ],
    undefined, //[ ZCOMMAND_HEADER, "ZCOMMAND" ],
    undefined, //[ ZSTDERR_HEADER, "ZSTDERR" ],
];

/*
ZFERR is described as “error in reading or writing file”. It’s really
not a good idea from a security angle for the endpoint to expose this
information. We should parse this and handle it as ZABORT but never send it.

Likewise with ZFREECNT: the sender shouldn’t ask how much space is left
on the other box; rather, the receiver should decide what to do with the
file size as the sender reports it.
*/

var FRAME_NAME_CREATOR = {};

for (var fc=0; fc<FRAME_CLASS_TYPES.length; fc++) {
    if (!FRAME_CLASS_TYPES[fc]) continue;

    FRAME_NAME_CREATOR[ FRAME_CLASS_TYPES[fc][1] ] = FRAME_CLASS_TYPES[fc][0];

    Object.assign(
        FRAME_CLASS_TYPES[fc][0].prototype,
        {
            TYPENUM: fc,
            NAME: FRAME_CLASS_TYPES[fc][1],
        }
    );
}

//----------------------------------------------------------------------

const CREATORS = [
    ZRQINIT_HEADER,
    ZRINIT_HEADER,
    ZSINIT_HEADER,
    ZACK_HEADER,
    ZFILE_HEADER,
    ZSKIP_HEADER,
    'ZNAK',
    ZABORT_HEADER,
    ZFIN_HEADER,
    ZRPOS_HEADER,
    ZDATA_HEADER,
    ZEOF_HEADER,
    ZFERR_HEADER,
    'ZCRC', //ZCRC_HEADER, -- leaving unimplemented?
    'ZCHALLENGE',
    'ZCOMPL',
    'ZCAN',
    'ZFREECNT', // ZFREECNT_HEADER,
    'ZCOMMAND',
    'ZSTDERR',
];

function _get_blank_header(typenum) {
    var creator = CREATORS[typenum];
    if (typeof(creator) === "string") {
        throw( "Received unsupported header: " + creator );
    }

    /*
    if (creator === ZCRC_HEADER) {
        return new creator([0, 0, 0, 0]);
    }
    */

    return _get_blank_header_from_constructor(creator);
}

//referenced outside TODO
function _get_blank_header_from_constructor(creator) {
    if (creator.prototype instanceof ZOffsetHeader) {
        return new creator(0);
    }

    return new creator([]);
}

function _parse_binary16(bytes_arr) {

    //The max length of a ZDLE-encoded binary header w/ 16-bit CRC is:
    //  3 initial bytes, NOT ZDLE-encoded
    //  2 typenum bytes     (1 decoded)
    //  8 data bytes        (4 decoded)
    //  4 CRC bytes         (2 decoded)

    //A 16-bit payload has 7 ZDLE-encoded octets.
    //The ZDLE-encoded octets follow the initial prefix.
    var zdle_decoded = Zmodem.ZDLE.splice( bytes_arr, BINARY16_HEADER_PREFIX.length, 7 );

    return zdle_decoded && _parse_non_zdle_binary16(zdle_decoded);
}

function _parse_non_zdle_binary16(decoded) {
    Zmodem.CRC.verify16(
        decoded.slice(0, 5),
        decoded.slice(5)
    );

    var typenum = decoded[0];
    var hdr = _get_blank_header(typenum);
    hdr._bytes4 = decoded.slice( 1, 5 );

    return hdr;
}

function _parse_binary32(bytes_arr) {

    //Same deal as with 16-bit CRC except there are two more
    //potentially ZDLE-encoded bytes, for a total of 9.
    var zdle_decoded = Zmodem.ZDLE.splice(
        bytes_arr,     //omit the leading "*", ZDLE, and "C"
        BINARY32_HEADER_PREFIX.length,
        9
    );

    if (!zdle_decoded) return;

    Zmodem.CRC.verify32(
        zdle_decoded.slice(0, 5),
        zdle_decoded.slice(5)
    );

    var typenum = zdle_decoded[0];
    var hdr = _get_blank_header(typenum);
    hdr._bytes4 = zdle_decoded.slice( 1, 5 );

    return hdr;
}

function _parse_hex(bytes_arr) {

    //A hex header always has:
    //  4 bytes for the ** . ZDLE . 'B'
    //  2 hex bytes for the header type
    //  8 hex bytes for the header content
    //  4 hex bytes for the CRC
    //  1-2 bytes for (CR/)LF
    //  (...and at this point the trailing XON is already stripped)
    //
    //----------------------------------------------------------------------
    //A carriage return and line feed are sent with HEX headers.  The
    //receive routine expects to see at least one of these characters, two
    //if the first is CR.
    //----------------------------------------------------------------------
    //
    //^^ I guess it can be either CR/LF or just LF … though those two
    //sentences appear to be saying contradictory things.

    var lf_pos = bytes_arr.indexOf( 0x8a );     //lrzsz sends this

    if (-1 === lf_pos) {
        lf_pos = bytes_arr.indexOf( 0x0a );
    }

    var hdr_err, hex_bytes;

    if (-1 === lf_pos) {
        if (bytes_arr.length > 11) {
            hdr_err = "Invalid hex header - no LF detected within 12 bytes!";
        }

        //incomplete header
        return;
    }
    else {
        hex_bytes = bytes_arr.splice( 0, lf_pos );

        //Trim off the LF
        bytes_arr.shift();

        if ( hex_bytes.length === 19 ) {

            //NB: The spec says CR but seems to treat high-bit variants
            //of control characters the same as the regulars; should we
            //also allow 0x8d?
            var preceding = hex_bytes[ hex_bytes.length - 1 ];
            if ( preceding !== 0x0d && preceding !== 0x8d ) {
                hdr_err = "Invalid hex header: (CR/)LF doesn’t have CR!";
            }
        }
        else if ( hex_bytes.length !== 18 ) {
            hdr_err = "Invalid hex header: invalid number of bytes before LF!";
        }
    }

    if (hdr_err) {
        hdr_err += " (" + hex_bytes.length + " bytes: " + hex_bytes.join() + ")";
        throw hdr_err;
    }

    //7 bytes ultimately:
    //  1 for typenum
    //  4 for header data
    //  2 for CRC
    var octets = new Array(7);

    //2 for typenum, 8 for bytes4, 4 for CRC
    for (var i=0; i<7; i++) {
        octets[i] = parseInt( String.fromCharCode( hex_bytes[4 + i * 2], hex_bytes[5 + i * 2] ), 16 );
    }

    return _parse_non_zdle_binary16(octets);
}

Zmodem.Header.parse_hex = _parse_hex;

}());
