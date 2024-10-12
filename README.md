# Interaction.js
simulate user interaction in webpage, complitable with vue and react

### Lightweight and Pure Native JS codes 

## Example
Douyin Publish video
```bash
(async () => {

const page = Interaction;
//step 1: fill editor .editor-kit-root-container input
page.inputAfterEnter(".editor-kit-root-container input", '${title}');
document.querySelector(".editor").innerText = '${desc}';

//step 2: fill tags
document.querySelector("div[class*='anchor-container-'] > .semi-select").click();
page.click(".semi-select-option", anchortype);
if(anchortype == '位置' && position){
    page.click(".semi-select", '输入地理位置');
    page.inputAfterEnter("div[class*='anchor-item-'] input", position);
    await page.sleep(2000);
    page.click("div[class*='option-v2-']", position);

}else{
    page.click(".semi-select", '粘贴抖音小程序链接');
    page.inputAfterEnter("div[class*='anchor-item-'] input", '${anchorUrl}');
}

//step 3: fill category
if(document.querySelector(".semi-cascader")){
    document.querySelector(".semi-cascader").click();
    page.click(".semi-cascader-option", '${catelog_name}');
    page.click(".semi-cascader-option-list:nth-child(2) .semi-cascader-option", '${subcatelog_name}');
    page.wait('.semi-space').then(element=>{
        const default_tags = element.innerText
        for(let tag of '${self_tags_name}'.split(',')){
            if(default_tags.indexOf(tag) == -1){
                page.inputAfterEnter(".semi-tagInput input", tag)
            }else{
                page.click(".semi-tag", tag)
            }
        }
    })
}

//step 4: fill hotspot
if(hotspot){
    page.click(".semi-select-selection-text", '点击输入热点词');
    page.inputAfterEnter(".container--nsGe1 input", '${hotspot_name}');
    await page.sleep(2000);
    page.click(".semi-select-option", '${hotspot_name}');
}

//step 5: fill ablum
if(album){
    document.querySelector("div[class*='sel-area-'] div[class*='select-collection-']").click();
    await page.sleep(2000);
    page.click(".semi-select-option", '${album_name}'); 
}

//step 6: select download permission
await page.click("label[class*='radio--']", '${download}')

//step 7: select publish options
page.click("label[class*='radio--']", publish);
if(publish == '定时发布'){
    page.inputAfterEnter(".semi-datepicker input", '${publish_time}');
}

//step 8: select platform
if(document.querySelector(".semi-switch input") && document.querySelector(".semi-switch input")?.checked != ${platforms}){
    document.querySelector(".semi-switch input").click();
}

//step 9: submit
await page.delayClick("div[class*='content-confirm-container-'] button", '发布', 5000);

})();
```
