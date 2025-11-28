/*
    InteractionJS - Web Interaction Simulator
    Compatible with Vue and React
    Optimized Version
*/
const InteractionJS = (function () {
    // 内部存储活跃的 observers 以便统一销毁
    const _activeObservers = [];

    /**
     * 等待指定时间的工具函数
     * @param {number} seconds 
     */
    const waitForTime = function (seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    };

    /**
     * 等待元素出现
     * @param {string} selector 
     * @param {HTMLElement} element Root element
     * @param {number} timeout timeout in ms (default 10000)
     */
    const waitForElement = function (selector, element = document, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = element.querySelector(selector);
            if (el) return resolve(el);

            let timer;
            const observer = new MutationObserver(() => {
                const el = element.querySelector(selector);
                if (el) {
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(element === document ? document.documentElement : element, {
                childList: true,
                subtree: true
            });

            // 超时处理，防止无限等待
            timer = setTimeout(() => {
                observer.disconnect();
                console.warn(`[InteractionJS] Timeout waiting for element: ${selector}`);
                // 根据需求，这里可以选择 reject 或者 resolve(null)
                resolve(null); 
            }, timeout);
        });
    };

    /**
     * 等待元素消失
     */
    const waitForElementToNotExist = function (selector, element = document, timeout = 10000) {
        return new Promise((resolve) => {
            const el = element.querySelector(selector);
            if (!el) return resolve();

            let timer;
            const observer = new MutationObserver(() => {
                const el = element.querySelector(selector);
                if (!el) {
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve();
                }
            });

            observer.observe(element === document ? document.documentElement : element, {
                childList: true,
                subtree: true
            });

            timer = setTimeout(() => {
                observer.disconnect();
                resolve(); // 超时也视为结束等待
            }, timeout);
        });
    };

    /**
     * 核心输入模拟逻辑 - 兼容 React 15/16+
     */
    const simulateInput = function (element, value) {
        if (!element) return;

        if (value === undefined || value === null) value = '';

        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            // React 16+ hack: 覆盖原生 value setter 使得 React 能感知到变化
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 
                "value"
            ).set;
            
            // 如果是 TextArea，原型链不同
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value"
            ).set;

            const setter = element instanceof HTMLTextAreaElement ? nativeTextAreaValueSetter : nativeInputValueSetter;
            
            if (setter) {
                setter.call(element, value);
            } else {
                element.value = value;
            }
        } else {
            // contenteditable 元素
            element.innerText = value;
        }

        // 触发必要的事件
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        // 部分框架可能依赖 keyup/keydown
        if (value !== '') {
            element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
    };

    // --- Actions ---

    const clickElement = async function (selector, element = document) {
        const el = await waitForElement(selector, element);
        if (el) el.click();
    };

    const clickElementWithString = async function (selector, string, element = document) {
        // 先确保至少有一个该选择器的元素存在
        await waitForElement(selector, element);

        if (!string) {
            return clickElement(selector, element);
        }

        const elements = element.querySelectorAll(selector);
        for (const el of elements) {
            // 使用 includes 并忽略空白字符干扰
            if (el.textContent && el.textContent.trim().includes(string)) {
                el.click();
                break; // 点击第一个匹配项
            }
        }
    };

    const clickPopoverElementWithString = async function (selector, containerSelector, string) {
        await clickElement(selector); // 点击触发弹出层
        // 等待弹出层出现并点击其中的内容，给予少量缓冲时间
        await waitForTime(0.5); 
        await clickElementWithString(containerSelector, string);
    };

    const hover = async function (selector, element = document) {
        const el = await waitForElement(selector, element);
        if (el) {
            el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }
    };

    const delayClick = async function (selector, string, delay) {
        await waitForTime(delay);
        await clickElementWithString(selector, string);
    };

    const inputElementWithString = async function (selector, string, element = document) {
        // 增加 await 确保元素存在
        const el = await waitForElement(selector, element);
        if (el) {
            // 聚焦以模拟真实交互
            el.focus();
            simulateInput(el, string);
            el.blur();
        }
    };

    const inputAndEnter = async function (selector, string, element = document) {
        const el = await waitForElement(selector, element);
        if (el) {
            el.focus();
            simulateInput(el, string);
            await waitForTime(0.1); // 短暂延迟确保 React 状态更新
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        }
    };

    const upload = async function (selector, filepath) {
        const element = await waitForElement(selector);
        if (element) {
            // 注意：出于安全原因，浏览器禁止 JS 直接设置 input file 的 value 为本地路径。
            // 这段代码仅在特定环境（如 Electron、Puppeteer 或 某些浏览器插件上下文）中有效。
            try {
                element.value = filepath;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (e) {
                console.warn("[InteractionJS] Cannot set file path programmatically in standard browser security context.");
            }
        }
    };

    // --- Scrolling ---

    const _getScrollContainer = (selector) => {
        if (!selector) return document.documentElement; // 通常 body 滚动对应 documentElement
        const el = document.querySelector(selector);
        // 如果选择器找不到，或者是指向 window，返回 documentElement
        if (!el || el === window) return document.documentElement;
        return el;
    };

    const scrollToBottom = function (selector) {
        const container = _getScrollContainer(selector);
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const scrollToRight = function (selector) {
        const container = _getScrollContainer(selector);
        if (container) {
            container.scrollTo({
                left: container.scrollWidth,
                behavior: 'smooth'
            });
        }
    };

    // --- Monitoring ---

    const monitor = async function (selector, callback) {
        const targetElement = await waitForElement(selector);
        if (!targetElement) return null;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    callback(mutation);
                }
            });
        });

        observer.observe(targetElement, { childList: true, subtree: false });
        _activeObservers.push(observer);
        return observer;
    };

    const stopMonitor = function (observer) {
        if (observer) {
            observer.disconnect();
            // 从数组中移除
            const index = _activeObservers.indexOf(observer);
            if (index > -1) _activeObservers.splice(index, 1);
        } else {
            // 停止所有
            _activeObservers.forEach(obs => obs.disconnect());
            _activeObservers.length = 0;
        }
    };

    // --- Misc ---

    const content = function (selector) {
        const container = document.querySelector(selector);
        return container ? container.innerText : '';
    };

    // 模拟获取回复 (Mock)
    const getReply = async function (input) {
        console.log(`[InteractionJS] Mock reply for: ${input}`);
        await waitForTime(0.5);
        return 'ok';
    };

    return {
        click: clickElement,
        clickString: clickElementWithString,
        clickPopover: clickPopoverElementWithString,
        hover: hover,
        wait: waitForElement,
        waitNot: waitForElementToNotExist,
        sleep: waitForTime,
        delayClick: delayClick,
        input: inputElementWithString,
        inputAndEnter: inputAndEnter,
        upload: upload,
        scrollToBottom: scrollToBottom,
        scrollToRight: scrollToRight,
        content: content,
        reply: getReply,
        monitor: monitor,
        stopMonitor: stopMonitor,
    };

})();
