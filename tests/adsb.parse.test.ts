import { parseADSB, ADSB_ParsedMessage_AircraftIdentificationAndCategory } from "../src/adsb/parse";
import { bitStringToFullBytes } from "../src/util/bits_and_bytes";
import { intToBitString } from "../src/util/test_helpers";



test('parseADSB', ()=>{

    expect(parseADSB(bitStringToFullBytes(
        intToBitString(10, 5) +
        intToBitString(2, 3) +
        intToBitString(1243, 6 * 8)
    ))).toStrictEqual({
        typeCode: 1,
        aircraftCategory: 6,
        callsign: 1243
    } as ADSB_ParsedMessage_AircraftIdentificationAndCategory)
})
