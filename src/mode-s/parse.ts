// docs see https://mode-s.org/1090mhz/content/mode-s/1-basics.html

import { bitStringToUnsignedIntegerSafe, bitStringToUnsignedIntegerSafeRangeFromBits, bitStringToFullBytes, bytesToFullBitString, parseBitStructure, Byte } from '../util/bits_and_bytes'


export type ModeS_ParsedMessage = {
    downlinkType: Byte
   contentBits: string
}

export interface ModeS_ParsedMessage_Type_ExtendedSquitter extends ModeS_ParsedMessage {
    downlinkType: 17
    transponderCapability: 0 | 4 | 5 | 6 | 7 /*
        0 = level 1 transponder
        1-3 = reserved
        4 = level 2+ transponder, with ability to set transponderCapability to 7, ON GROUND
        5 = level 2+ transponder, with ability to set transponderCapability to 7, AIRBORNE
        6 = level 2 transponder, with ability to set transponderCapability to 7, either ON GROUND or AIRBONE
        7 = Signifies the Downlink Request value is 0, or the Flight Status is 2, 3, 4, or 5, either airborne or on the ground
    */
   icaoAddress: number // 24 bits
}


export function parseModeS(bytes: Byte[]){

    // see https://mode-s.org/1090mhz/content/introduction.html#mode-s-format

    const bits = bytesToFullBitString(bytes)

    //TODO implement parity


    if(bits.substring(0, 2) === '11'){
        // special format 24

        //TODO
        throw new Error('unsupported mode s downlink type "24"')

    } else {

        const struct = parseBitStructure(bits, [{
            name: 'downlinkType',
            bits: 5
        }, {
            name: 'rest',
            bits: -1
        }])

        const downlinkType = bitStringToUnsignedIntegerSafeRangeFromBits(struct.get('downlinkType'), 5)

        if(downlinkType >= 16){
            // long 112 bit format

            const longStruct = parseBitStructure(struct.get('rest'), [{
                name: 'data',
                bits: 83
            }, {
                name: 'parity',
                bits: 24
            }])


            if(downlinkType === 17){
                // Mode S Extended Squitter

                const extendedSquitterStruct = parseBitStructure(longStruct.get('data'), [{
                    name: 'transponderCapability',
                    bits: 3
                }, {
                    name: 'icaoAircraftAddress',
                    bits: 24
                }, {
                    name: 'content',
                    bits: 56
                }])

                const ret: ModeS_ParsedMessage_Type_ExtendedSquitter = {
                    downlinkType,

                    transponderCapability: bitStringToUnsignedIntegerSafe(extendedSquitterStruct.get('transponderCapability'), [0, 4, 5, 6, 7], 'transponderCapability'),

                    icaoAddress: bitStringToUnsignedIntegerSafeRangeFromBits(extendedSquitterStruct.get('icaoAircraftAddress'), 24, 'icaoAircraftAddress'),

                    contentBits: extendedSquitterStruct.get('content')
                }

                return ret
            }

            //TODO
            throw new Error('unsupported mode s downlink type: "' + downlinkType + '"')

        } else {
            // short 56 bit format

            const shortStruct = parseBitStructure(struct.get('rest'), [{
                name: 'data',
                bits: 27
            }, {
                name: 'parity',
                bits: 24
            }])

            throw new Error('unsupported mode s downlink type: "' + downlinkType + '"')
        }
    }
}
