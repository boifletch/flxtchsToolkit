// ==UserScript==
// @name            Group Chat Reply
// @namespace       https://github.com/boifletch
// @version         0.9
// @author          flxtch
// @match           https://www.torn.com/*
// @grant           none
// @run-at          document-end
// ==/UserScript==

(async function () {
  const styling = `
    .rdiv {
        display: none;
        height: 1.6rem;
        padding: 0rem 0.5rem;
        align-items: center;
        width: fit-content;
        max-width: 14rem;
        background: #515151;
        font-weight: 700;
        justify-content: center;
        border-top-right-radius: 0.3rem;
        cursor: pointer;
    }
    .rdiv.vis {
      display: flex;
    }
  `;
  const sEl = document.createElement("style");
  document.body.appendChild(sEl);
  sEl.innerText = styling;
  const interv = setInterval(() => {
    const chatContainer = document.querySelector(".root___PF7AM");
    if (!chatContainer || !chatContainer.querySelector(".textarea___JRbO5"))
      return;
    main(chatContainer);
    clearInterval(interv);
  }, 333);

  function main(chatContainer) {
    new MutationObserver(onInnerChange).observe(chatContainer, {
      childList: true,
    });
    const existing = chatContainer.querySelectorAll(
      ".item___Db3l9:has(.root___tV4zg)",
    );
    inject(...existing);

    function onInnerChange(d) {
      for (let r of d) {
        const { addedNodes } = r;
        if (!addedNodes.length) continue;
        inject(...addedNodes);
      }
    }
    function inject(...elements) {
      for (let e of elements) {
        const roomWindow = e.querySelector(".content___aMpKJ");
        if (roomWindow) injectToRoom(roomWindow);
        // else injectToDM(e.querySelector(".content___Zhqe1"));
      }

      function injectToRoom(chatInner) {
        if (!chatInner) return;
        const tArea = chatInner.querySelector(".textarea___JRbO5");
        const sBtn = chatInner.querySelector("button");
        const replyTab = document.createElement("div");
        const roomType = chatInner.parentElement.id;
        const messageStorageKey = getRoomKey(roomType);
        const replyTargetKey = messageStorageKey + ":replyingTo";
        const propsKey = getPropsKey();
        replyTab.classList.add("rdiv");
        chatInner.children[0].insertAdjacentElement("afterend", replyTab);
        replyTab.addEventListener("click", onDisable);
        chatInner.addEventListener("click", onclk);
        if (window.localStorage[replyTargetKey])
          onEnable(
            window.localStorage[replyTargetKey],
            window.localStorage[messageStorageKey],
            true,
          );
        function onclk(e) {
          const concatAt = 400;
          const flags = [
            "root___EP_Dq",
            "box___eWW6m",
            "root___XpplE",
            "root___RoNAh",
          ];
          if (
            !e.target ||
            !e.target.className ||
            !e.target.className.includes ||
            !flags.some((f) => e.target.className.includes(f)) ||
            e.target.className.includes("divider")
          )
            return;
          const outLevels = flags.findIndex((f) =>
            e.target.className.includes(f),
          );
          let rootEl = e.target;
          for (let i = 0; i < outLevels; i++) rootEl = rootEl.parentElement;
          const sender = rootEl
            .querySelector(".sender___WTwPl")
            .innerText.replaceAll(":", "");
          const message = rootEl.querySelector(
            "." + flags[flags.length - 1],
          ).innerText;
          onEnable(
            sender,
            message.length <= concatAt
              ? message
              : message.slice(0, concatAt + 1) + "...",
          );
        }
        function onEnable(sender, message, excludeFlavourText = false) {
          message = message.replaceAll("\\n", "\n").replaceAll("\\", "");
          if (message.startsWith('"')) message = message.slice(1);
          if (message.endsWith('"'))
            message = message.slice(0, message.length - 1);
          const content = excludeFlavourText
            ? message
            : `*replied to* **${sender}**\n*"${message}"*\n\n`;

          replyTab.innerText = `replying to ${sender}`;
          tArea.value = content;
          tArea.defaultValue = content;
          tArea[propsKey].onChange({ target: { value: content } });
          replyTab.classList.add("vis");
          tArea.focus()
          tArea.setSelectionRange(9999,9999)
          tArea.scrollTo({top: 9999, behaviour: "smooth"})
          window.localStorage[replyTargetKey] = sender;
          window.localStorage[messageStorageKey] = content;
          sBtn.addEventListener("click", onButton);
          tArea.addEventListener("keydown", onKey);
        }
        function onDisable() {
          replyTab.innerText = "";
          tArea.value = "";
          tArea.defaultValue = "";
          tArea[propsKey].onChange({ target: { value: "" } });
          replyTab.classList.remove("vis");
          tArea.focus();
          window.localStorage[replyTargetKey] = "";
          window.localStorage[messageStorageKey] = "";
          sBtn.removeEventListener("click", onButton);
          tArea.removeEventListener("keydown", onKey);
        }
        function onKey(e) {
          if (e.key === "Enter") onSend();
        }
        function onButton() {
          onSend();
        }
        function onSend() {
          setTimeout(onDisable, 100);
        }
        function getPropsKey() {
          return Object.keys(tArea).find((k) => k.includes("__reactProps"));
        }
      }
      function injectToDM(chatInner) {}
      function getRoomKey(k) {
        return `tchat:room:${k}:input`;
      }
    }
  }
})();
