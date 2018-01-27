import '../sass/style.scss';
import { $, $$ } from './modules/bling';
import autocomplete  from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map'



autocomplete($('#address'), $('#lat'), $('#lng'));
let search = document.querySelector('.search')
typeAhead( search );
makeMap( $('#map') );
