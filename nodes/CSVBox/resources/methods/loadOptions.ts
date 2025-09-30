import { ILoadOptionsFunctions, INodePropertyOptions, NodeOperationError  } from "n8n-workflow";
import { csvboxApiRequest } from "../GenericFunctions";


export async function getSheets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const returnData: INodePropertyOptions[] = [];
    const response = await csvboxApiRequest.call(this, 'GET', '/list-sheets');
    if (Array.isArray(response)) {
        for (const sheet of response) {
            returnData.push({
                name: sheet.name,
                value: sheet.value,
            });
        }
    }

    if(returnData.length === 0) {
        throw new NodeOperationError(this.getNode(), 'No sheets found');
    }

    return returnData;
}