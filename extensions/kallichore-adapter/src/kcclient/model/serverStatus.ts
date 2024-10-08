/**
 * Kallichore API
 * Kallichore is a Jupyter kernel gateway and supervisor
 *
 * The version of the OpenAPI document: 1.0.0
 * Contact: info@posit.co
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { RequestFile } from './models';

export class ServerStatus {
    'sessions': number;
    'active': number;
    'busy': boolean;
    'version': string;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "sessions",
            "baseName": "sessions",
            "type": "number"
        },
        {
            "name": "active",
            "baseName": "active",
            "type": "number"
        },
        {
            "name": "busy",
            "baseName": "busy",
            "type": "boolean"
        },
        {
            "name": "version",
            "baseName": "version",
            "type": "string"
        }    ];

    static getAttributeTypeMap() {
        return ServerStatus.attributeTypeMap;
    }
}

