import type {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	IDataObject
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';
import { csvboxApiRequest, testSampleRow } from './GenericFunctions';
import { loadOptions } from './resources/methods';

export class CsvboxTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CSVBox Trigger',
		name: 'csvboxTrigger',
		icon: 'file:csvbox-logo.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when a new row is imported to a CSVBox Sheet',
		defaults: {
			name: 'CSVBox Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'csvboxApi',
				required: true
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		mockManualExecution: true,
		properties: [
			{
				displayName: 'Sheet Name or ID',
				name: 'sheetId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSheets',
					loadOptionsDependsOn: ['csvboxApi'],
				},
				options: [],
				required: true,
				default: '',
				validateType: 'string',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
		],
	};

	webhookMethods = {
		default: {
			checkExists: this.checkWebhook,
			create:this.createWebhook,
			delete: this.deleteWebhook,
		},
	};

	methods = {
		loadOptions,
	};

	async checkWebhook(this: IHookFunctions): Promise<boolean> {
		const qs: IDataObject = {};
		const webhookData = this.getWorkflowStaticData('node');
		if(Object.keys(webhookData).length === 0 || !webhookData.webhookId) {
			return false;
		}
		const webhookUrl = this.getNodeWebhookUrl('default');
		const sheetId = this.getNodeParameter('sheetId') as string;
		qs.sheetId = sheetId;
		
		try {
			const webhook = await csvboxApiRequest.call(this, 'GET', `/hook/${sheetId}`, {} , qs);
			if (webhook.url === webhookUrl) {
				webhookData.webhookId = webhook.id;
				return true;
			}
		} catch (err) {
			throw new NodeApiError(this.getNode(), err);
		}
		return false;
	}

	async createWebhook(this: IHookFunctions): Promise<boolean> {
		const webhookUrl = this.getNodeWebhookUrl('default');
		const sheetId = this.getNodeParameter('sheetId') as string;

		const body: IDataObject = {
			sheetId,
			target_url: webhookUrl,
		}
		if(this.getMode() === 'manual') {
			await testSampleRow.call(this, webhookUrl);
			return true;
		}

		try {
			if(this.getMode() === 'trigger') {
				const webhookId = await csvboxApiRequest.call(this, 'POST', `/hook`, body)
		
				if (webhookId) {
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = webhookId as string;
					return true;
				}
			}
		} catch (err) {
			throw new NodeApiError(this.getNode(), err);
		}
		return false;
	}

	async deleteWebhook(this: IHookFunctions): Promise<boolean> {
		const qs: IDataObject = {};

		const webhookData = this.getWorkflowStaticData('node');
		if(!webhookData.webhookId) {
			return false;
		}
		
		const sheetId = this.getNodeParameter('sheetId') as string;
		qs.sheetId = sheetId;
		qs.webhookId = webhookData.webhookId;

		try {
			await csvboxApiRequest.call(this, 'DELETE', `/hook/${sheetId}`, {}, qs);
		} catch (error) {
			return false;
		}
		delete webhookData.webhookId;
		return true;
	}

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}