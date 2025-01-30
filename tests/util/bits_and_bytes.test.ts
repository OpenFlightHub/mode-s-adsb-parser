import { byteToShortBitString, byteToFullBitString, bytesToFullBitString, bitStringToFullBytes, bitStringToUnsignedInteger, bitStringToUnsignedIntegerSafe, bitStringToUnsignedIntegerSafeRanges, bitStringToUnsignedIntegerSafeRangeFromBits, parseBitStructure } from "../../src/util/bits_and_bytes";

test('byteToShortBitString', ()=>{
    expect(byteToShortBitString(4)).toStrictEqual('100')
    expect(byteToShortBitString(37)).toStrictEqual('100101')
})

test('byteToFullBitString', ()=>{
    expect(byteToFullBitString(4)).toStrictEqual('00000100')
    expect(byteToFullBitString(37)).toStrictEqual('00100101')
})

test('bytesToFullBitString', ()=>{
    expect(bytesToFullBitString([4, 37])).toStrictEqual('00000100' + '00100101')
})

test('bitStringToFullBytes', ()=>{
    expect(bitStringToFullBytes('00000100' + '00010000')).toStrictEqual([4, 16])
    expect(()=>{
        bitStringToFullBytes('10')
    }).toThrow()
})

test('bitStringToUnsignedInteger', ()=>{
    expect(bitStringToUnsignedInteger('1010')).toStrictEqual(10)
    expect(()=>{
        bitStringToUnsignedInteger('x')
    }).toThrow()
})

test('bitStringToUnsignedIntegerSafe', ()=>{
    expect(bitStringToUnsignedIntegerSafe('00010001', [17])).toStrictEqual(17)
    expect(()=>{
        bitStringToUnsignedIntegerSafe('1', [0])
    }).toThrow()
})

test('bitStringToUnsignedIntegerSafeRanges', ()=>{
    expect(bitStringToUnsignedIntegerSafeRanges('100', [[0, 4]])).toStrictEqual(4)
    expect(bitStringToUnsignedIntegerSafeRanges('100', [[3, 4]])).toStrictEqual(4)
    expect(bitStringToUnsignedIntegerSafeRanges('100', [[4, 4]])).toStrictEqual(4)
    expect(()=>{
        bitStringToUnsignedIntegerSafeRanges('100', [[5, 8]])
    }).toThrow()
})
