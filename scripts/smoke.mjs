import {EtymologyExplorerClient} from '../dist/index.js';
const client = new EtymologyExplorerClient({userAgent:'NamesResearchSmoke/0.1 (https://github.com/lambdawalker/names.api.etymology-explorer)'});
const matches = await client.autocomplete('David');
const match = matches.data.auto_complete_data.find(m => m.word === 'David' && m.language === 'English');
if (!match) throw Error('Expected David English candidate');
const details = await client.getDetails(match._id);
console.log(JSON.stringify({match,locator:details.locator,retrievedAt:details.retrievedAt,data:details.data},null,2));
