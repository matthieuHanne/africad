function LPdriver(){this.derive_doc=function(){return("undefined"!=typeof g_isfirefox&&g_isfirefox&&LP?LP.getBrowser().contentDocument:document)||null},this.find_element_by_id=function(e,n){return e||(e=this.derive_doc())?e.getElementById(n):null},this.find_element_by_name=function(e,n){if(!e&&!(e=this.derive_doc()))return null;var t=e.getElementsByName(n);return!t||t.length<1?null:t[0]},this.find_element_by_xpath=function(e,n){return e||(e=this.derive_doc())?LP_getElementByXPath(e,n):null},this.find_element_by_link_text=function(e,n){return e||(e=this.derive_doc()),null},this.find_element_by_partial_link_text=function(e,n){return e||(e=this.derive_doc()),null},this.find_element_by_tag_name=function(e,n){if(!e&&!(e=this.derive_doc()))return null;if(void 0!==e.getElementsByTagName){var t=e.getElementsByTagName(n);return t&&t.length>0?t[0]:null}return null},this.find_element_by_class_name=function(e,n){if(!e&&!(e=this.derive_doc()))return null;var t=e.getElementsByClasName(n);return!t||t.length<1?null:t[0]},this.find_element_by_css_selector=function(e,n){if(!e&&!(e=this.derive_doc()))return null;if(void 0===e.querySelectorAll)return null;var t=e.querySelectorAll(n);return t&&t.length>0?t:null},this.find_elements_by_name=function(e,n){return e||(e=this.derive_doc())?e.getElementsByName(n):null},this.find_elements_by_xpath=function(e,n){return e||(e=this.derive_doc())?LP_getElementByXPath(e,n):null},this.find_elements_by_link_text=function(e,n){return e||(e=this.derive_doc()),null},this.find_elements_by_partial_link_text=function(e,n){return e||(e=this.derive_doc()),null},this.find_elements_by_tag_name=function(e,n){if(!e&&!(e=this.derive_doc()))return null;if(void 0!==e.getElementsByTagName){var t=e.getElementsByTagName(n);return t&&t.length>0?t:null}return null},this.find_elements_by_class_name=function(e,n){return e||(e=this.derive_doc())?e.getElementsByClassName(n):null},this.find_elements_by_css_selector=function(e,n){if(!e&&!(e=this.derive_doc()))return null;if(void 0===e.querySelectorAll)return null;var t=e.querySelectorAll(n);return t&&t.length>0?t:null},this.find_input_elements_by_id=function(e,n){if(!e&&!(e=this.derive_doc()))return null;if(void 0!==e.getElementsByTagName){var t,i=e.getElementsByTagName("INPUT"),l=[];if(i)for(t=0;t<i.length;t++)i[t]&&i[t].id==n&&l.push(i[t]);return l.length<1?null:l}}}