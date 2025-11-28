/*
    simulate user interaction in webpage, compatible with Vue & React
*/

const InteractionJS = (() => {

    /* -------------------------
        基础工具
    ------------------------- */
    const query = (selector, root = document) => root.querySelector(selector);
    const queryAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const waitForElement = (selector, root = document) => {
        return new Promise(resolve => {
            const exist = query(selector, root);
            if (exist) return resolve(exist);

            const observer = new MutationObserver(() => {
                const el = query(selector, root);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    };

    const waitForElementToNotExist = (selector, root = document) => {
        return new Promise(resolve => {
            if (!query(selector, root)) return resolve();

            const observer = new MutationObserver(() => {
                if (!query(selector, root)) {
                    observer.disconnect();
                    resolve();
                }
            });

            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    };

    const sleep = sec => new Promise(resolve => setTimeout(resolve, sec * 1000));

    /* -------------------------
        点击操作
    ------------------------- */

    const click = async (selector, root = document) => {
        try {
            const el = await waitForElement(selector, root);
            el.click();
        } catch (e) {
            console.warn("Click failed:", selector, e);
        }
    };

    const clickString = async (selector, text, root = document) => {
        await waitForElement(selector, root);

        if (!text) return click(selector, root);

        const list = queryAll(selector, root);
        const target = list.find(el => el.textContent.includes(text));

        if (target) target.click();
    };

    const clickPopover = async (triggerSelector, containerSelector, text) => {
        await click(triggerSelector);
        await clickString(containerSelector, text);
    };

    /* -------------------------
        悬停、延迟点击
    ------------------------- */

    const hover = async (selector, root = document) => {
        const el = await waitForElement(selector, root);
        requestAnimationFrame(() => {
            el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        });
    };

    const delayClick = async (selector, text, delay) => {
        await sleep(delay);
        await clickString(selector, text);
    };

    /* -------------------------
        输入操作
    ------------------------- */

    const simulateInput = (el, value) => {
        if (!el) return;

        if (value === "") {
            cleanInput(el);
            return;
        }

        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const setter = Object.getOwnPropertyDescriptor(el.__proto__, "value").set;
            setter.call(el, value);
        } else {
            el.innerHTML = "";
            el.appendChild(document.createTextNode(value));
        }

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const cleanInput = el => {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            simulateInput(el, "");
            return;
        }

        el.innerHTML = "";
    };

    const input = async (selector, value, root = document) => {
        const el = await waitForElement(selector, root);
        simulateInput(el, value);
    };

    const inputAndEnter = async (selector, value, root = document) => {
        const el = await waitForElement(selector, root);

        simulateInput(el, value);

        el.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                keyCode: 13,
                bubbles: true,
            })
        );
    };

    /* -------------------------
        文件上传（无法完全绕过浏览器安全限制）
    ------------------------- */

    const upload = async (selector, filepath) => {
        const el = await waitForElement(selector);
        await sleep(1); // 稍微等一下，避免元素刚出现时还不可写
        el.value = filepath; // 仅适用于自动化环境
    };

    /* -------------------------
        滚动
    ------------------------- */

    const getScrollContainer = selector => {
        const el = query(selector);
        return el || document.scrollingElement || document.body;
    };

    const scrollToBottom = selector => {
        const el = getScrollContainer(selector);
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };

    const scrollToRight = selector => {
        const el = getScrollContainer(selector);
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    };

    /* -------------------------
        内容获取
    ------------------------- */

    const content = selector => {
        const el = query(selector);
        return el ? el.innerText : "";
    };

    /* -------------------------
        Mutation Observer
    ------------------------- */

    const monitor = async (selector, callback) => {
        const target = await waitForElement(selector);
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === "childList") callback(m);
            });
        });

        observer.observe(target, { childList: true, subtree: false });
        return observer;
    };

    const stopMonitor = observer => {
        if (observer) {
            observer.disconnect();
        }
    };

    /* -------------------------
        Fake Reply API
    ------------------------- */
    const reply = async text => {
        return "ok";
    };

    /* -------------------------
        API 导出
    ------------------------- */

    return {
        click,
        clickString,
        clickPopover,
        hover,
        wait: waitForElement,
        waitNot: waitForElementToNotExist,
        sleep,
        delayClick,
        input,
        inputAndEnter,
        upload,
        scrollToBottom,
        scrollToRight,
        content,
        reply,
        monitor,
        stopMonitor,
    };

})();
