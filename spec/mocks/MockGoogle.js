export default class MockGoogle {
	constructor() {
		class MockGoogleAuth {
			getClient() {}
		}

		const mockSpreadSheet = {
			properties: {
				title: 'Mock Sheet'
			},
			update: async ()=>{},
			get: async ()=>{
				return {
					data: {
						values: [[1,2,3]],
						properties: {
							title: 'Mock Sheet'
						}
					},
				}
			}
		};

		const mockDocument = {
			data: {
				body: {
					content: [
						{
							paragraph: {
								elements: [
									{
										textRun: {
											content: "My Document Title"
										}
									}
								]
							}
						}
					]
				}
			}
		};

		this.auth={
			GoogleAuth: MockGoogleAuth
		}

		this.sheets=()=>{
			return {
				spreadsheets: {
					values: mockSpreadSheet,
					batchUpdate: async ()=>{},
					get: async ()=> {
						return {
							data: {
								sheets: [mockSpreadSheet]
							}
						}
					}
				}
			}
		},
		this.drive=()=>{
			return {
				files: {
					create: async ()=> {
						return {
							data: {
								id: "1"
							}
						}
					},
					export: async () => {
						return {
							data: new ArrayBuffer(8)
						}
					}
				}
			}
		},
		this.docs=()=>{
			return {
				documents: {
					get: async () => mockDocument,
					create: async ()=> {
						return {
							data: {
								id: "1"
							}
						}
					}
				}
			}
		}
	}
}