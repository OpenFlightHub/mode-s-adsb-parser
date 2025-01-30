import { ModeS_ParsedMessage, parseModeS } from "../../src/mode-s/parse";
import { bitStringToFullBytes, bytesToFullBitString } from "../../src/util/bits_and_bytes";
import { intToBitString } from "../../src/util/test_helpers";

test('parseModeS', ()=>{
    expect(parseModeS(bitStringToFullBytes(
        intToBitString(17, 5) +
        intToBitString(5, 3) +
        intToBitString(2025, 24) +
        bytesToFullBitString([25, 26, 27])
    ))).toStrictEqual({
        downlinkFormat: 17,
        transponderCapability: 5,
        icaoAddress: 2025,
        contentBytes: [25, 26, 27]
    } as ModeS_ParsedMessage)
})
