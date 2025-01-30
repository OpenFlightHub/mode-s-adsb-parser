// docs see https://mode-s.org/1090mhz/content/mode-s/1-basics.html

import { bitStringToUnsignedIntegerSafe, bitStringToUnsignedIntegerSafeRangeFromBits, bitStringToFullBytes, bytesToFullBitString, parseBitStructure, Byte } from '../util/bits_and_bytes'


export type ModeS_ParsedMessage = {
    downlinkFormat: Byte
    transponderCapability: 0 | 4 | 5 | 6 | 7 /*
        0 = level 1 transponder
        1-3 = reserved
        4 = level 2+ transponder, with ability to set transponderCapability to 7, ON GROUND
        5 = level 2+ transponder, with ability to set transponderCapability to 7, AIRBORNE
        6 = level 2 transponder, with ability to set transponderCapability to 7, either ON GROUND or AIRBONE
        7 = Signifies the Downlink Request value is 0, or the Flight Status is 2, 3, 4, or 5, either airborne or on the ground
    */
   icaoAddress: number // 24 bits
   contentBytes: Byte[]
}


export function parseModeS(bytes: Byte[]){

    // see https://mode-s.org/1090mhz/content/mode-s/1-basics.html and https://mode-s.org/1090mhz/content/ads-b/1-basics.html

    const bits = bytesToFullBitString(bytes)

    const struct = parseBitStructure(bits, [{
        name: 'downlinkFormat',
        bits: 5
    }, {
        name: 'transponderCapability',
        bits: 3
    }, {
        name: 'icaoAircraftAddress',
        bits: 24
    }, {
        name: 'rest',
        bits: -1
    }])

    const ret: ModeS_ParsedMessage = {
        downlinkFormat: bitStringToUnsignedIntegerSafeRangeFromBits(struct.get('downlinkFormat'), 5, 'downlinkFormat'),

        transponderCapability: bitStringToUnsignedIntegerSafe(struct.get('transponderCapability'), [0, 4, 5, 6, 7], 'transponderCapability'),

        icaoAddress: bitStringToUnsignedIntegerSafeRangeFromBits(struct.get('icaoAircraftAddress'), 24, 'icaoAircraftAddress'),

        contentBytes: bitStringToFullBytes(struct.get('rest'))
    }

    return ret
}
