import template from '../templates/terms.html?raw';
import {page} from '../render';
export async function GET(){return page(template)}
