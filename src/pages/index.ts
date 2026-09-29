import template from '../templates/home.html?raw';
import {page} from '../render';
export async function GET(){return page(template,true)}
