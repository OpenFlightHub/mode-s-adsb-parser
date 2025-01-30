// docs see https://mode-s.org/1090mhz/content/mode-s/1-basics.html

import { bitStringToUnsignedIntegerSafeRangeFromBits, bytesToFullBitString, Byte, parseBitStructure, bitStringToUnsignedIntegerSafe } from '../util/bits_and_bytes'
import { decodeGrayCode } from '../util/gray_code'
import { addMissingProperties, ComputeRange } from '../util/typescript'


export type ADSB_ParsedMessage = ADSB_ParsedMessage_AircraftIdentificationAndCategory | ADSB_ParsedMessage_SurfacePosition | ADSB_ParsedMessage_AirbornePosition | ADSB_ParsedMessage_OperationStatus

type ADSB_ParsedMessage_Base = {
    typeCode: number /*
        1–4 	Aircraft identification
        5–8 	Surface position
        9–18 	Airborne position (w/Baro Altitude)
        19 	Airborne velocities
        20–22 	Airborne position (w/GNSS Height)
        23–27 	Reserved
        28 	Aircraft status
        29 	Target state and status information
        31 	Aircraft operation status
    */
}

export interface ADSB_ParsedMessage_AircraftIdentificationAndCategory extends ADSB_ParsedMessage_Base {
    typeCode: 1 | 2 | 3 | 4
    aircraftCategory: ComputeRange<8>[number]
    callsign: number
}

export interface ADSB_ParsedMessage_SurfacePosition extends ADSB_ParsedMessage_Base, CprData {
    groundSpeedAvailable: boolean
    groundSpeedAbove175kt: boolean
    groundSpeed: number
    groundTrackAvailable: boolean
    groundTrack: number // true north (the point on the Earth's surface that intersects the Earth's rotational axis.)
    time: boolean
}

export type ADSB_ParsedMessage_AirbornePosition = ADSB_ParsedMessage_AirbornePosition_AltitudeBarometric | ADSB_ParsedMessage_AirbornePosition_AltitudeGnss

interface ADSB_ParsedMessage_AirbornePosition_Base extends ADSB_ParsedMessage_Base, CprData {
    surveilanceStatus: 'no_condition' | 'permanent_alert' | 'temporary_alert' | 'spi_condition'
    singleAntennaFlag: boolean
    time: boolean
}

export interface ADSB_ParsedMessage_AirbornePosition_AltitudeBarometric extends ADSB_ParsedMessage_AirbornePosition_Base {
    typeCode: 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
    altitudeInFeetBarometric: number
}

export interface ADSB_ParsedMessage_AirbornePosition_AltitudeGnss extends ADSB_ParsedMessage_AirbornePosition_Base {
    typeCode: 20 | 21 | 22
    altitudeInMetersGnss: number
}

export type ADSB_ParsedMessage_OperationStatus = ADSB_ParsedMessage_OperationStatus_v1 | ADSB_ParsedMessage_OperationStatus_v2

export type ADSB_ParsedMessage_OperationStatus_v1 = ADSB_ParsedMessage_OperationStatus_v1_Airborne | ADSB_ParsedMessage_OperationStatus_v1_Surface

interface ADSB_ParsedMessage_OperationStatus_v1_Base extends ADSB_ParsedMessage_Base {
    typeCode: 31
    subType: 'airborne' | 'surface'
    operationalMode: number
    adsbVersion: 0 | 1
    nicSuplement: boolean
    navigationalAccuracyCategoryPosition: number
    surveilanceIntegrityLevel: number
    horizontalReferenceDirection: boolean
}

export interface ADSB_ParsedMessage_OperationStatus_v1_Airborne extends ADSB_ParsedMessage_OperationStatus_v1_Base {
    airborneCapacityClass: number
    barometricAltitudeQuality: number
    barometricAltitudeIntegrity: number
}

export interface ADSB_ParsedMessage_OperationStatus_v1_Surface extends ADSB_ParsedMessage_OperationStatus_v1_Base {
    surfaceCapacityClass: number
    lengthWidthCode: number
    trackAngleOrHeading: number
}

export type ADSB_ParsedMessage_OperationStatus_v2 = ADSB_ParsedMessage_OperationStatus_v2_Airborne | ADSB_ParsedMessage_OperationStatus_v2_Surface

interface ADSB_ParsedMessage_OperationStatus_v2_Base extends ADSB_ParsedMessage_Base {
    typeCode: 31
    subType: 'airborne' | 'surface'
    adsbVersion: 0 | 1 | 2
    nicSuplement: boolean
    horizontalReferenceDirection: boolean
    sourceIntegrityLevel: number
    silSupplement: boolean
}


export interface ADSB_ParsedMessage_OperationStatus_v2_Airborne extends ADSB_ParsedMessage_OperationStatus_v2_Base {
    airborneCapacityClass: number
    airborneOperationalMode: number
    geometricVerticalAccuracy: number
    barometricAltitudeIntegrity: boolean
}

export interface ADSB_ParsedMessage_OperationStatus_v2_Surface extends ADSB_ParsedMessage_OperationStatus_v2_Base {
    surfaceCapacityClass: number
    lengthWidthCode: number
    surfaceOperationalMode: number
    trackAngleOrHeading: number
}


export type CprData = {
    cprFormat: 'odd' | 'even'
    cprEncodedPosition: {
        latitude: number
        longitude: number
    }
}

export function parseADSB(bytes: Byte[]): ADSB_ParsedMessage {

    const bitString = bytesToFullBitString(bytes)

    const structGeneral = parseBitStructure(bitString, [{
        name: 'typeCode',
        bits: 5
    }, {
        name: 'rest',
        bits: -1
    }])

    const typeCode = bitStringToUnsignedIntegerSafeRangeFromBits(structGeneral.get('typeCode'), 5, 'typeCode')

    if(typeCode >= 1 && typeCode <= 4){
        // identification and category, see https://mode-s.org/1090mhz/content/ads-b/2-identification.html

        const structIdentificationAndCategory = parseBitStructure(structGeneral.get('rest'), [{
            name: 'category',
            bits: 3
        }, {
            name: 'callsign',
            bits: 6 * 8
        }])

        const aircraftCategory = bitStringToUnsignedIntegerSafeRangeFromBits(structIdentificationAndCategory.get('category'), 3, 'category')

        const ret: ADSB_ParsedMessage_AircraftIdentificationAndCategory = {
            typeCode: typeCode as 1 | 2 | 3 | 4,// fix typescript typing not correct inside if statement
            aircraftCategory,
            callsign: bitStringToUnsignedIntegerSafeRangeFromBits(structIdentificationAndCategory.get('callsign'), 6 * 8)
        }

        return ret

    } else if(typeCode >= 5 && typeCode <= 8){
        // surface position https://mode-s.org/1090mhz/content/ads-b/4-surface-position.html

        const structSurfacePosition = parseBitStructure(structGeneral.get('rest'), [{
            name: 'groundSpeed',
            bits: 7
        }, {
            name: 'groundTrackStatus',
            bits: 1
        }, {
            name: 'groundTrack',
            bits: 7
        }, {
            name: 'time',
            bits: 1
        }, {
            name: 'cprFormat',
            bits: 1
        }, {
            name: 'cprEncodedLatitude',
            bits: 17
        }, {
            name: 'cprEncodedLongitude',
            bits: 17
        }])


        const gspeed = bitStringToUnsignedIntegerSafeRangeFromBits(structSurfacePosition.get('groundSpeed'), 7, 'groundSpeed')
        const g = convertQuantizedGroundSpeed(gspeed)

        const groundTrackAvailable = structSurfacePosition.get('groundTrackStatus') === '1'

        const ret: ADSB_ParsedMessage_SurfacePosition = {
            typeCode,
            groundSpeedAvailable: g.groundSpeedAvailable,
            groundSpeedAbove175kt: g.groundSpeedAbove175kt,
            groundSpeed: g.groundSpeed,
            groundTrackAvailable,
            groundTrack: groundTrackAvailable ? bitStringToUnsignedIntegerSafeRangeFromBits(structSurfacePosition.get('groundTrack'), 7, 'groundTrack') * 360 / 128 : 0,
            time: convertIntegerTo(
                bitStringToUnsignedIntegerSafeRangeFromBits(structSurfacePosition.get('time'), 1, 'time'),
                {
                    '0': false,
                    '1': true
                }, 'time'
            ),
            cprFormat: convertIntegerTo(
                bitStringToUnsignedIntegerSafeRangeFromBits(structSurfacePosition.get('cprFormat'), 1, 'cprFormat'),
                {
                    '0': 'even',
                    '1': 'odd'
                }, 'time'
            ),
            cprEncodedPosition: {
                latitude: bitStringToUnsignedIntegerSafeRangeFromBits(structSurfacePosition.get('cprEncodedLatitude'), 17, 'cprEncodedLatitude'),
                longitude: bitStringToUnsignedIntegerSafeRangeFromBits(structSurfacePosition.get('cprEncodedLongitude'), 17, 'cprEncodedLongitude')
            }
        }

        return ret

    } else if((typeCode >= 9 && typeCode <= 18) || (typeCode >= 20 && typeCode <= 22)){
        // airborne position https://mode-s.org/1090mhz/content/ads-b/3-airborne-position.html

        const structAirbornePosition = parseBitStructure(structGeneral.get('rest'), [{
            name: 'surveilanceStatus',
            bits: 2
        }, {
            name: 'singleAntennaFlag',
            bits: 1
        }, {
            name: 'encodedAltitude',
            bits: 12
        }, {
            name: 'time',
            bits: 1
        }, {
            name: 'cprFormat',
            bits: 1
        }, {
            name: 'cprEncodedLatitude',
            bits: 17
        }, {
            name: 'cprEncodedLongitude',
            bits: 17
        }])

        const base: ADSB_ParsedMessage_AirbornePosition_Base = {
            typeCode,
            surveilanceStatus: convertIntegerTo(
                bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('surveilanceStatus'), 2, 'surveilanceStatus'),
                {
                    '0': 'no_condition',
                    '1': 'permanent_alert',
                    '2': 'temporary_alert',
                    '3': 'spi_condition',
                }, 'surveilanceStatus'),
            singleAntennaFlag: convertIntegerTo(
                bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('singleAntennaFlag'), 1, 'singleAntennaFlag'),
                {
                    '0': false,
                    '1': true
                }, 'singleAntennaFlag'),
            time: convertIntegerTo(
                bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('time'), 1, 'time'),
                {
                    '0': false,
                    '1': true
                }, 'time'
            ),
            cprFormat: convertIntegerTo(
                bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('cprFormat'), 1, 'cprFormat'),
                {
                    '0': 'even',
                    '1': 'odd'
                }, 'time'
            ),
            cprEncodedPosition: {
                latitude: bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('cprEncodedLatitude'), 17, 'cprEncodedLatitude'),
                longitude: bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('cprEncodedLongitude'), 17, 'cprEncodedLongitude')
            }
        }


        if(typeCode <= 18){
            // Barometric altitude

            const struct = parseBitStructure(structAirbornePosition.get('encodedAltitude'), [{
                name: 'beforeQbit',
                bits: 7
            }, {
                name: 'qBit',
                bits: 1
            }, {
                name: 'afterQbit',
                bits: 4
            }])

            const qBit = struct.get('qBit') === '1'

            const numb = bitStringToUnsignedIntegerSafeRangeFromBits(struct.get('beforeQbit') + struct.get('afterQbit'), 7 + 4, 'encodedAltitudeWithoutQbit')

            const altitudeInFeetBarometric = qBit ? (25 * numb - 1000) : (decodeGrayCode(numb) * 100)

            const ret = addMissingProperties<ADSB_ParsedMessage_AirbornePosition_Base, ADSB_ParsedMessage_AirbornePosition_AltitudeBarometric>(base, {
                altitudeInFeetBarometric
            })

            return ret
        } else {

            const altitudeInMetersGnss = bitStringToUnsignedIntegerSafeRangeFromBits(structAirbornePosition.get('encodedAltitude'), 12, 'encodedAltitudeAsMetersInGnss')

            const ret = addMissingProperties<ADSB_ParsedMessage_AirbornePosition_Base, ADSB_ParsedMessage_AirbornePosition_AltitudeGnss>(base, {
                altitudeInMetersGnss
            })

            return ret
        }


    } else if(typeCode === 19){
        // airborne velocity see https://mode-s.org/1090mhz/content/ads-b/5-airborne-velocity.html

        //TODO
    } else if(typeCode === 28){
        // aircraft status

        //TODO
    } else if(typeCode === 29){
        // target state and status information

        //TODO
    } else if(typeCode === 31){
        // operation status see https://mode-s.org/1090mhz/content/ads-b/6-operation-status.html

        const structOperationStatus = parseBitStructure(structGeneral.get('rest'), [{
            name: 'subType',
            bits: 3
        }, {
            name: 'capacityClassCodes',
            bits: 16
        }, {
            name: 'operationalModeCodes',
            bits: 16
        }, {
            name: 'adsbVersion',
            bits: 3
        }, {
            name: 'rest',
            bits: 1 + 4 + 2 + 2 + 1 + 1 + 2
        }])

        const adsbVersion = bitStringToUnsignedIntegerSafe(structOperationStatus.get('adsbVersion'), [0, 1, 2], 'adsbVersion')

        if(adsbVersion === 0){
            throw new Error('invalid adsbVersionNumber, version 0 does not send messages')
        } else if(adsbVersion === 1){

            const structOperationStatus_v1 = parseBitStructure(structGeneral.get('rest'), [{
                name: 'subType',
                bits: 3
            }, {
                name: 'capacityClassCodes',
                bits: 16
            }, {
                name: 'operationalModeCodes',
                bits: 16
            }, {
                name: 'adsbVersion',
                bits: 3
            }, {
                name: 'nicSupplement',
                bits: 1
            }, {
                name: 'navigationalAccuracyCategoryPosition',
                bits: 4
            }, {
                name: 'barometricAltitudeQuality_or_reserved',
                bits: 2
            }, {
                name: 'surveilanceIntegrityLevel',
                bits: 2
            }, {
                name: 'barometricAltitudeIntegrity_or_trackAngleOrHeading',
                bits: 2
            }, , {
                name: 'horizontalReferenceDirection',
                bits: 1
            }, {
                name: 'reserved',
                bits: 2
            }])

            const subType = convertIntegerTo<'airborne' | 'surface'>(bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('subType'), 3, 'subType'), {
                '0': 'airborne',
                '1': 'surface'
            })

            const base: ADSB_ParsedMessage_OperationStatus_v1_Base = {
                typeCode,
                subType,
                adsbVersion: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('adsbVersion'), 3, 'adsbVersion'),
                operationalMode: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('operationalModeCodes'), 16, 'operationalModeCodes'),
                nicSuplement: convertIntegerTo(bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('nicSupplement'), 1, 'nicSuplement'), {
                    '0': false,
                    '1': true
                }),
                navigationalAccuracyCategoryPosition: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('navigationalAccuracyCategoryPosition'), 4, 'navigationalAccuracyCategoryPosition'),

                surveilanceIntegrityLevel: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('surveilanceIntegrityLevel'), 2, 'surveilanceIntegrityLevel'),

                horizontalReferenceDirection: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('horizontalReferenceDirection'), 1, 'horizontalReferenceDirection'),
            }

            if(subType == 'airborne'){

                return addMissingProperties<typeof base, ADSB_ParsedMessage_OperationStatus_v1_Airborne>(base, {
                    airborneCapacityClass: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('capacityClassCodes'), 16, 'capacityClassCodes'),

                    barometricAltitudeQuality: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('barometricAltitudeQuality_or_reserved'), 2, 'barometricAltitudeQuality_or_reserved'),

                    barometricAltitudeIntegrity: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('barometricAltitudeIntegrity_or_trackAngleOrHeading'), 1, 'barometricAltitudeIntegrity_or_trackAngleOrHeading'),
                })

            } else if(subType === 'surface'){

                const structSurfaceCapacityClass = parseBitStructure(structOperationStatus_v1.get('capacityClassCodes'), [{
                    name: 'capacityCode',
                    bits: 12
                }, {
                    name: 'lengthWidthCode',
                    bits: 4
                }])

                return addMissingProperties<typeof base, ADSB_ParsedMessage_OperationStatus_v1_Surface>(base, {
                    surfaceCapacityClass: bitStringToUnsignedIntegerSafeRangeFromBits(structSurfaceCapacityClass.get('capacityCode')
                        , 12, 'capacityCode'),

                    lengthWidthCode: bitStringToUnsignedIntegerSafeRangeFromBits(structSurfaceCapacityClass.get('lengthWidthCode'), 4, 'lengthWidthCode'),

                    trackAngleOrHeading: bitStringToUnsignedIntegerSafeRangeFromBits(structOperationStatus_v1.get('barometricAltitudeIntegrity_or_trackAngleOrHeading'), 1, 'trackAngleHeading'),
                })
            }

        } else if(adsbVersion === 2){
            //TODO
        }

    } else {
        throw Error('invalid typeCode: ' + typeCode)
    }

}

/**
 *
 * @param speed any integer between 0 and 127 (including 0 and 127)
 * @returns
 */
function convertQuantizedGroundSpeed(speed: ComputeRange<128>[number]): {groundSpeedAvailable: boolean, groundSpeedAbove175kt: boolean, groundSpeed: number} {

    // see https://mode-s.org/1090mhz/content/ads-b/4-surface-position.html#tb:adsb-surf-pos-mov

    const quantizations: {from: number, to: number, beginSpeed: number, step: number}[] = [{
        from: 2,
        to: 8,
        beginSpeed: 0.125,
        step: 0.125
    },{
        from: 9,
        to: 12,
        beginSpeed: 1,
        step: 0.25
    },{
        from: 13,
        to: 38,
        beginSpeed: 2,
        step: 0.5
    },{
        from: 39,
        to: 93,
        beginSpeed: 15,
        step: 1
    },{
        from: 94,
        to: 108,
        beginSpeed: 70,
        step: 2
    },{
        from: 109,
        to: 123,
        beginSpeed: 100,
        step: 5
    }]

    const ret = {
        groundSpeedAvailable: true,
        groundSpeedAbove175kt: false,
        groundSpeed: 0
    }

    if(speed === 0){
        ret.groundSpeedAvailable = false
    } else if(speed === 1){
        ret.groundSpeed = 0
    } else if(speed === 124){
        ret.groundSpeedAbove175kt = true
        ret.groundSpeed = 175
    } else if(speed >= 125){
        throw new Error('invalid groundSpeed for quantization: ' + speed)
    } else {
        const quantization = quantizations.find(a => {
            return speed >= a.from && speed <= a.to
        })

        if(!quantization){
            throw new Error('could not find quantization definition for speed: ' + speed)
        }

        ret.groundSpeed = quantization.beginSpeed + (speed - quantization.from) * quantization.step
    }

    return ret
}

function convertIntegerTo<D extends any>(int: number, definitions: {[key: string]: D}, debugLabel?: string){
    if(int > Number.MAX_SAFE_INTEGER || int < Number.MIN_SAFE_INTEGER || Math.floor(int) !== int){
        throw new Error('int is not an integer')
    }

    const intString = '' + int

    if(!Object.hasOwnProperty(intString)){
        throw new Error('int ' + (debugLabel ? debugLabel + ' ' : '') + 'does not fit any definition: ' + int)
    }

    return definitions[intString]
}

/**
 *
 * @returns string with length 8
 */
function parseCallsignBytes(bitString: string){
    // identification and category, see https://mode-s.org/1090mhz/content/ads-b/2-identification.html

    const struct = parseBitStructure(bitString, [{
        name: 'callsign_0',
        bits: 6
    }, {
        name: 'callsign_1',
        bits: 6
    }, {
        name: 'callsign_2',
        bits: 6
    }, {
        name: 'callsign_3',
        bits: 6
    }, {
        name: 'callsign_4',
        bits: 6
    }, {
        name: 'callsign_5',
        bits: 6
    }, {
        name: 'callsign_6',
        bits: 6
    }, {
        name: 'callsign_7',
        bits: 6
    }])

    const callsignChars = []

    for(let i = 0; i < 8; i++){
        const callsignCharNumber = bitStringToUnsignedIntegerSafeRangeFromBits(struct.get(
            // @ts-ignore
            'callsign_' + i
        ), 6, 'callsign_' + i)

        const char = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ##### ###############0123456789######'.charAt(callsignCharNumber)
        callsignChars.push(char)
    }

    return callsignChars.join('')
}