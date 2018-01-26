import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete  from './modules/autocomplete';
import typeAhead from './modules/typeAhead';



autocomplete($('#address'), $('#lat'), $('#lng'));
let search = document.querySelector('.search')
// console.log('search :', search)
typeAhead( search );
