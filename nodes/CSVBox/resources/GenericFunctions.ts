import {
	type IDataObject,
	type IExecuteFunctions,
	type IHookFunctions,
	type ILoadOptionsFunctions,
	type IWebhookFunctions,
	type IHttpRequestMethods,
    type ITriggerFunctions,
    NodeApiError,
    JsonObject,
    IHttpRequestOptions,
} from 'n8n-workflow';
import { Baseurl } from './common/constants';

export async function csvboxApiRequest(
    this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions | ITriggerFunctions,
    method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
) {
    try {
        const credentialsType = 'csvboxApi';
        const credentials = await this.getCredentials(credentialsType);
        
        const options: IHttpRequestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-csvbox-api-key': credentials.apiKey,
                'x-csvbox-secret-api-key': credentials.apiSecretKey
            },
            qs: query,
            body,
            url: uri || `${Baseurl}${endpoint}`,
            json: true,
        };
    
        if (!Object.keys(body as IDataObject).length) {
            delete options.body;
        }
    
        if (Object.keys(option).length) {
            Object.assign(options, option);
        }
		return await this.helpers.httpRequest(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function testSampleRow(
    this: IHookFunctions,
    webhookUrl: string
): Promise<boolean> {
    try {
        const sheetId = this.getNodeParameter('sheetId') as string;
        if (!sheetId) {
            throw new Error('Sheet ID is required');
        }

        const sampleDataArray = await csvboxApiRequest.call( this, 'GET', `/sheets/${sheetId}` );
        if (!Array.isArray(sampleDataArray) || sampleDataArray.length === 0) {
            throw new Error('No sample data found for the selected sheet.');
        }

        const options: IHttpRequestOptions = {
            method: 'POST',
            url: webhookUrl,
            body: sampleDataArray,
            json: true,
        };

        await this.helpers.httpRequest(options);
        return true;
    } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
    }
}