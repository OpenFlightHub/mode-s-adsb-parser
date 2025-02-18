import { calculateUnambigiousLocation, decodeBasics } from "./adsb/decode"
import { parseADSB } from "./adsb/parse"
import { ModeS_ParsedMessage_Type_ExtendedSquitter, parseModeS } from "./mode-s/parse"
import {bufferToBytes, bytesToFullBitString} from "./util/bits_and_bytes"

export default function runExample(){

    //TODO

    const message1 = Buffer.from('8D40621D58C386435CC412692AD6', 'hex')

    const message1parsedModeS = parseModeS(bufferToBytes(message1))
    if(message1parsedModeS.downlinkType === 17){
        const message1decodedBasics = decodeBasics(parseADSB(message1parsedModeS as ModeS_ParsedMessage_Type_ExtendedSquitter))

        const message2 = Buffer.from('8D40621D58C382D690C8AC2863A7', 'hex')

        const message2parsedModeS = parseModeS(bufferToBytes(message2))

        const message2decodedBasics = decodeBasics(parseADSB(message2parsedModeS))

        if(message1decodedBasics.locationInformation.locationAvailable && message2decodedBasics.locationInformation.locationAvailable){
            calculateUnambigiousLocation([message1decodedBasics.locationInformation.location, message2decodedBasics.locationInformation.location])
        }
    }
}