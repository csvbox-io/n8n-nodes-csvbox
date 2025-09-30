import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	// IAuthenticateGeneric,
	// ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CsvboxApi implements ICredentialType {
	name = 'csvboxApi';
	displayName = 'CSVBox API';
	documentationUrl = 'https://help.csvbox.io/destinations/n8n';
	
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions:{password: true},
			required: true,
			description: 'Your API Key from the CSVBox API Key page',
			default: '',
		},
		{
			displayName: 'API Secret Key',
			name: 'apiSecretKey',
			type: 'string',
			typeOptions:{password: true},
			required: true,
			description: 'Your API Secret Key from the CSVBox API Key page',
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Accept': 'application/json',
				'x-csvbox-api-key': '={{$credentials.apiKey}}',
				'x-csvbox-secret-api-key': '={{$credentials.apiSecretKey}}'
			}
		}
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: "https://app.csvbox.io/n8nworkflow/api/v1",
			url: '/auth'
		},
	};
}
