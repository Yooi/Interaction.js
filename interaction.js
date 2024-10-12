/*
    simulate user interaction in webpage, complitable with vue and react
*/
const InteractionJS = (function(){
    const clickElementWithString = async function(selector, string, element = document){
        //if its html element
        await waitForElement(selector, element)
        if(!string||string.length==0){
            clickElement(selector, element);
            return
        }
        const elements = element.querySelectorAll(selector)
        // Iterate through the paragraph elements
        for (const el of elements) {
            // Check if the paragraph contains the specific string
            if (el.textContent.includes(string)) {
                // Trigger a click event on the paragraph
                el.click();
                break; // Remove this line if you want to click all matching elements
            }
        }
    }

    const clickElement = async function(selector, element = document){
        element.querySelector(selector).click()
    }

    //e.g. click button->pop model->click element with string
    const clickPopoverElementWithString = async function(selector, container, string){
        await waitForElement(selector)
        document.querySelector(selector).click();
        // Iterate through the paragraph elements
        clickElementWithString(container, string);
    }

    const hover = async function(selector, element = document){
        await waitForElement(selector, element)
        const el = element.querySelector(selector);
        el.dispatchEvent(new MouseEvent('mouseenter'));
    }

    const delayClick = async function(selector, string, delay){
        await waitForTime(delay)
        clickElementWithString(selector, string)
    }

// 开始监视DOM变化
//const myObserver = await monitor('#chatList', myCallback);

// 停止监视单个Observer
// await stopMonitor(myObserver);

// 停止所有Observer
// await stopMonitor();
    const monitor = async function(selector, callback){
      // 获取目标元素
      const targetElement = document.querySelector(selector);
      
      // 创建一个MutationObserver实例
      const observer = new MutationObserver(mutations => {
          // 调用回调函数，并将变化传递给它
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    callback(mutation);
                }
                console.log('Change--', mutation.type, mutation.target)
            })

      });

      // 监视目标元素的变化
      observer.observe(targetElement, { childList: true, subtree: false });

      // 返回MutationObserver实例
      return observer;
    }

    const stopMonitor = async function(observer){
      if (observer) {
        // 停止单个Observer
        observer.disconnect();
      } else {
        // 停止所有Observer
        const activeObservers = document.querySelectorAll('[data-mutation-observer]');
        activeObservers.forEach(activeObserver => {
          activeObserver.disconnect();
        });
      }
    }

    const waitForElement = function(selector, element = document) {
        return new Promise(resolve => {
            const el = element.querySelector(selector);
            if (el) {
                return resolve(el);
            }
    
            const observer = new MutationObserver(mutations => {
                // Query for elements matching the specified selector
                const el = element.querySelector(selector);
    
                if (el) {
                    resolve(el);
                    observer.disconnect();
                }
            });
    
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        });
    }
    
    const waitForElementToNotExist = function(selector, element = document) {
        return new Promise(resolve => {
            const el = element.querySelector(selector);
            if (!el) {
                return resolve();
            }
    
            const observer = new MutationObserver(mutations => {
                // Query for elements matching the specified selector
                const el = element.querySelector(selector);
    
                if (!el) {
                    resolve();
                    observer.disconnect();
                }
            });
    
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        });
    }
    //wait for seconds
    const waitForTime = function(time){
        return new Promise(resolve => {
            setTimeout(()=>{
                resolve()
            }, time*1000)
        })
    }

    const inputElementWithString = function(selector, string, element = document){
        const el = element.querySelector(selector)
        // Iterate through the paragraph elements
        if (el) {
            // Check if the paragraph contains the specific string
            //element.innerText = string
            simulateInput(el, string)
        }
    }

    const inputAndEnter = async function(selector, string, element = document){
        await waitForElement(selector, element)
        const el = element.querySelector(selector)
        el.focus()
        // Iterate through the paragraph elements
        if (el) {
            // Check if the paragraph contains the specific string
            simulateInput(el, string)
            el.dispatchEvent(new KeyboardEvent('keydown',{'key':'Enter', keyCode: 13, bubbles: true }))
        }
    }
    
    
    //because of the react, we need to simulate the input event
    //https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
    //because after react >= 16, the event is not triggered by the native event
    const simulateInput = function(element, value) {
        if(value.length == 0){
            cleanInputContext(element)
            return
        }
        if(element instanceof HTMLInputElement){
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(element, value);
        }else{
            // 创建一个文本节点
            const textNode = document.createTextNode(value);

            // 将文本节点添加到contenteditable元素中
            element.innerHTML = ''; // 清空内容
            element.appendChild(textNode);
        }
        
        // hack React15
        // fire the event input and change
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    }

    const cleanInputContext = function(element) {
        if(element instanceof HTMLInputElement){
            simulateInput(element, '')
            return;
        }
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        //backspace to remove selection
        for (let i = 0; i < selection.toString().length; i++) {
            const deleteEvent = new KeyboardEvent('keydown', {
              key: 'Backspace',
              keyCode: 8,
              bubbles: true,
              cancelable: true,
            });
            element.dispatchEvent(deleteEvent);
        }
    }

    const upload = async function(selector, filepath){
        waitForElement(selector).then(async element => { await this.sleep(1000); element.value = "${filepath}" });
    }

    const scrollToBottom = function(selector){
        const containers = document.querySelector(selector)||window;
        if (containers) {
            const container = containers.window == window? document.body:containers;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth' // 平滑滚动效果
            });
        }
    }

    const scrollToRight = function(selector){
        const containers = document.querySelector(selector)||window;
        if (containers) {
            const container = containers.window == window? document.body:containers;
            container.scrollTo({
                left: container.scrollWidth - container.clientWidth,
                behavior: 'smooth' // 平滑滚动效果
            });
        }
    }

    //no action
    const content = function(selector){
        const container = document.querySelector(selector);
        return container.innerText
    }

    const getReply = async function(input){
        return 'ok'
        try {
            const response = await fetch('https://example.com/api/reply', {
                method: 'POST', // or 'GET', 'PUT', etc.
                headers: {
                    'Content-Type': 'application/json',
                    // You can add additional headers here if needed
                },
                body: JSON.stringify({ content:input }), // Convert content to JSON and send it in the request body
            });
            if (!response.ok) {
                throw new Error('Failed to fetch reply');
            }
            const reply = await response.json(); // Assuming the reply is in JSON format
            return reply;
        } catch (error) {
            console.error('Error fetching reply:', error);
            // Handle error gracefully or rethrow to propagate it
            throw error;
        }
    }

    return {
        //click item
        click:clickElement,
        //click item with string
        clickString:clickElementWithString,
        clickPopover:clickPopoverElementWithString,
        hover:hover,
        wait:waitForElement,
        waitNot:waitForElementToNotExist,
        sleep:waitForTime,
        delayClick:delayClick,
        input:inputElementWithString,
        inputAndEnter:inputAndEnter,
        upload:upload,
        scrollToBottom:scrollToBottom,
        scrollToRight:scrollToRight,
        content:content,
        reply:getReply,
        monitor:monitor,
        stopMonitor:stopMonitor,
    }

})()