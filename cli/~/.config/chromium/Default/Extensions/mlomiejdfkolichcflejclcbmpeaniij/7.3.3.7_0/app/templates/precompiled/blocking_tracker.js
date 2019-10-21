module.exports=function(t){var a,l="";return l+='<div class="flex align-middle trk-header">\n\t<span class="warning-image right" title="" data-template-classes="warning-tooltip '+(null==(a=t.id)?"":a)+'" tabindex="1" data-h-offset="5" data-v-offset="30" data-hover-delay="1200"\tdata-tooltip aria-haspopup="true" data-disable-hover="false">\n\t</span>\n\t<div class="trk-name">'+(null==(a=t.name)?"":a)+'</div>\n\t<div class="flex-fill"></div>\n\t<div class="svg-container">\n\t\t<span class="tracker-tooltip left" title="'+(null==(a=t.panel_tracker_trust_tooltip)?"":a)+'" data-template-classes="blocking-tooltip"\n\t\t\t\ttabindex="1" data-h-offset="5" data-v-offset="30" data-hover-delay="1200"\n\t\t\t\tdata-tooltip aria-haspopup="true" data-disable-hover="false">\n\t\t\t<svg class="trust" width="20px" height="20px" viewbox="0 0 20 20">\n\t\t\t\t<g>\n\t\t\t\t\t<title>'+(null==(a=t.panel_tracker_trust_tooltip)?"":a)+'</title>\n\t\t\t\t\t<path class="border" d="M1,1 l18,0 l0,18 l-18,0 l0,-18"></path>\n\t\t\t\t\t<path class="background" d="M2,2 l16,0 l0,16 l-16,0 l0,-16"></path>\n\t\t\t\t\t<path class="shield" d="M10.1063482,5.01604251 C10.0424848,4.9946525 9.95751518,4.9946525 9.89365179,5.01604251 L5.31918081,6.22941467 C5.12772679,6.27192221 5,6.44222483 5,6.63378123 C5.02137858,9.89092117 6.76597947,12.9137247 9.765925,14.9361025 C9.82978839,14.97861 9.9148942,15 10,15 C10.0851058,15 10.1702116,14.97861 10.234075,14.9361025 C13.2340205,12.9137247 14.9786214,9.89092117 15,6.63378123 C15,6.44222483 14.8722732,6.27192221 14.6808192,6.22941467 L10.1063482,5.01604251 Z"></path>\n\t\t\t\t</g>\n\t\t\t</svg>\n\t\t</span>\n\t\t<span class="tracker-tooltip left" title="'+(null==(a=t.panel_tracker_restrict_tooltip)?"":a)+'" data-template-classes="blocking-tooltip"\n\t\t\t\ttabindex="1" data-h-offset="5" data-v-offset="30" data-hover-delay="1200"\n\t\t\t\tdata-tooltip aria-haspopup="true" data-disable-hover="false">\n\t\t\t<svg class="restrict" width="20px" height="20px" viewbox="0 0 20 20">\n\t\t\t\t<g>\n\t\t\t\t\t<title>'+(null==(a=t.panel_tracker_restrict_tooltip)?"":a)+'</title>\n\t\t\t\t\t<path class="border" d="M1,1 l18,0 l0,18 l-18,0 l0,-18"></path>\n\t\t\t\t\t<path class="background" d="M2,2 l16,0 l0,16 l-16,0 l0,-16"></path>\n\t\t\t\t\t<path class="lock" d="M7.09090909,9.48275862 L6.99703014,9.48275862 C6.45303631,9.48275862 6,9.93008471 6,10.4818894 L6,14.0008692 C6,14.548501 6.4463856,15 6.99703014,15 L13.0029699,15 C13.5469637,15 14,14.5526739 14,14.0008692 L14,10.4818894 C14,9.93425764 13.5536144,9.48275862 13.0029699,9.48275862 L12.9090909,9.48275862 L12.9090909,7.90818975 C12.9090909,6.30964904 11.6066465,5 10,5 C8.39662266,5 7.09090909,6.3020409 7.09090909,7.90818975 L7.09090909,9.48275862 Z M7.57575758,9.50286456 L7.57575758,7.76048278 C7.57575758,6.48983426 8.6608335,5.45977011 10,5.45977011 C11.3388721,5.45977011 12.4242424,6.48886151 12.4242424,7.75909549 L12.4242424,9.52268315 L7.57575758,9.50286456 Z"></path>\n\t\t\t\t</g>\n\t\t\t</svg>\n\t\t</span>\n\t\t<span class="tracker-tooltip left" title="'+(null==(a=t.panel_tracker_block_tooltip)?"":a)+'" data-template-classes="blocking-tooltip status-tooltip"\n\t\t\t\ttabindex="1" data-h-offset="5" data-v-offset="30" data-hover-delay="1200"\n\t\t\t\tdata-tooltip aria-haspopup="true" data-disable-hover="false">\n\t\t\t<svg class="status" width="20px" height="20px" viewbox="0 0 20 20">\n\t\t\t\t<g>\n\t\t\t\t\t<title>'+(null==(a=t.panel_tracker_block_tooltip)?"":a)+'</title>\n\t\t\t\t\t<path class="border" d="M1,1 l18,0 l0,18 l-18,0 l0,-18"></path>\n\t\t\t\t\t<path class="background" d="M2,2 l16,0 l0,16 l-16,0 l0,-16"></path>\n\t\t\t\t\t<polygon class="check" points="5.38461538 9.5 4 11 7.69230769 15 16 6.5 14.6153846 5 7.69230769 12"></polygon>\n\t\t\t\t\t<path class="shield" d="M10.1063482,5.01604251 C10.0424848,4.9946525 9.95751518,4.9946525 9.89365179,5.01604251 L5.31918081,6.22941467 C5.12772679,6.27192221 5,6.44222483 5,6.63378123 C5.02137858,9.89092117 6.76597947,12.9137247 9.765925,14.9361025 C9.82978839,14.97861 9.9148942,15 10,15 C10.0851058,15 10.1702116,14.97861 10.234075,14.9361025 C13.2340205,12.9137247 14.9786214,9.89092117 15,6.63378123 C15,6.44222483 14.8722732,6.27192221 14.6808192,6.22941467 L10.1063482,5.01604251 Z"></path>\n\t\t\t\t\t<path class="lock" d="M7.09090909,9.48275862 L6.99703014,9.48275862 C6.45303631,9.48275862 6,9.93008471 6,10.4818894 L6,14.0008692 C6,14.548501 6.4463856,15 6.99703014,15 L13.0029699,15 C13.5469637,15 14,14.5526739 14,14.0008692 L14,10.4818894 C14,9.93425764 13.5536144,9.48275862 13.0029699,9.48275862 L12.9090909,9.48275862 L12.9090909,7.90818975 C12.9090909,6.30964904 11.6066465,5 10,5 C8.39662266,5 7.09090909,6.3020409 7.09090909,7.90818975 L7.09090909,9.48275862 Z M7.57575758,9.50286456 L7.57575758,7.76048278 C7.57575758,6.48983426 8.6608335,5.45977011 10,5.45977011 C11.3388721,5.45977011 12.4242424,6.48886151 12.4242424,7.75909549 L12.4242424,9.52268315 L7.57575758,9.50286456 Z"></path>\n\t\t\t\t</g>\n\t\t\t</svg>\n\t\t</span>\n\t</div>\n</div>\n'};