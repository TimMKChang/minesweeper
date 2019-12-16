const GAME_STATE = {
  FirstClickAwaits: "FirstClickAwaits",
  GamePlaying: "GamePlaying",
  GameFinished: "GameFinished",
}

const model = {
  sizeRow: 9,
  sizeCol: 9,
  bombNumber: 10,
  boxData: {},
  bombPosition: [],
  bombDigged: [],
  countTime: 0,
  // 壓著左右鍵
  isLeftClicking: false,
  isRightClicking: false,
  isLeftClickingDisabled: false,
  isFaceBtnLeftClicking: false,

  // win or lose
  isLose() {
    return this.bombDigged.length > 0;
  },
  isWin() {
    let notDiggedCount = 0;
    Object.keys(this.boxData).forEach(boxId => {
      if (!this.boxData[boxId]["isDigged"]) {
        notDiggedCount++;
      }
    });
    return notDiggedCount === this.bombNumber;
  },
  checkLoseOrWin() {
    if (model.isLose()) {
      controller.currentState = GAME_STATE.GameFinished;
      clearInterval(model.timeCounter);

      view.showDiggedBombBG();
      view.showBomb();
      view.showRemainBombNumber();
      view.showLoseFace();
    } else if (model.isWin()) {
      controller.currentState = GAME_STATE.GameFinished;
      clearInterval(model.timeCounter);

      view.showFlagOnBombBox();
      view.showRemainBombNumber();
      view.showWinFace();
    }
  },
}

const view = {
  buildClickZone() {
    const clickZone = document.querySelector("#click-zone");
    let htmlContent = "";
    for (let i = 1; i <= model.sizeRow; i++) {
      htmlContent += `<div class="each-row d-flex flex-row">`;
      for (let j = 1; j <= model.sizeCol; j++) {
        htmlContent += `<div id="box-${i}-${j}" class="box covered-box"></div>`;
      }
      htmlContent += `</div>`;
    }
    clickZone.innerHTML = htmlContent;
  },
  setFlag(boxHTML) {
    if (!boxHTML.matches(".covered-box")) {
      return;
    }
    if (!controller.isFlaged(boxHTML) && controller.calculateRemainBombNumber() > 0) {
      boxHTML.innerHTML = `<i class="far fa-flag"></i>`;
    } else {
      boxHTML.innerHTML = "";
    }
  },
  showBomb() {
    model.bombPosition.forEach(bombBoxPosition => {
      const boxHTML = document.querySelector(`#${bombBoxPosition}`);
      model.boxData[boxHTML.id]["isDigged"] = true;
      boxHTML.classList.remove("covered-box");
      boxHTML.classList.remove("flag");
      boxHTML.innerHTML = `<i class="fas fa-bomb"></i>`;
    });
  },
  showDiggedBombBG() {
    model.bombDigged.forEach(boxHTML => {
      boxHTML.classList.add("opened-bomb");
    });
  },
  showFlagOnBombBox() {
    model.bombPosition.forEach(bombBoxId => {
      const boxHTML = document.querySelector(`#${bombBoxId}`);
      boxHTML.innerHTML = `<i class="far fa-flag"></i>`;
    });
  },

  showCountTime() {
    const clockNumberContainer = document.querySelector("#clock-number-container");
    // 處理顯示，目前不處理大於1000情形
    const time = model.countTime % 1000;
    const hundredthNumber = Math.floor(time / 100);
    const tenthNumber = Math.floor(time % 100 / 10);
    const digitNumber = time % 10;
    clockNumberContainer.innerHTML = "";
    clockNumberContainer.append(utility.createDigitalClockNumber(clockNumberContainer, hundredthNumber));
    clockNumberContainer.append(utility.createDigitalClockNumber(clockNumberContainer, tenthNumber));
    clockNumberContainer.append(utility.createDigitalClockNumber(clockNumberContainer, digitNumber));
  },
  showRemainBombNumber() {
    const remainBombContainerHTML = document.querySelector("#remain-bomb-number-container");
    // 目前不處理大於1000情形
    const remainBombNumber = controller.calculateRemainBombNumber() % 1000;
    const hundredthNumber = Math.floor(remainBombNumber / 100);
    const tenthNumber = Math.floor(remainBombNumber % 100 / 10);
    const digitNumber = remainBombNumber % 10;
    remainBombContainerHTML.innerHTML = "";
    remainBombContainerHTML.append(utility.createDigitalClockNumber(remainBombContainerHTML, hundredthNumber));
    remainBombContainerHTML.append(utility.createDigitalClockNumber(remainBombContainerHTML, tenthNumber));
    remainBombContainerHTML.append(utility.createDigitalClockNumber(remainBombContainerHTML, digitNumber));
  },
  showLoseFace() {
    this.resetFace();
    const facrBtnHTML = document.querySelector("#face-btn");
    facrBtnHTML.classList.remove("fa-smile");
    facrBtnHTML.classList.add("fa-dizzy");
  },
  showWinFace() {
    this.resetFace();
    const facrBtnHTML = document.querySelector("#face-btn");
    facrBtnHTML.classList.remove("fa-smile");
    facrBtnHTML.classList.add("fa-laugh-beam");
  },
  resetFace() {
    // 這樣會有問題，但不知為何。在點face reset時 closest會失效
    // const faceBtnContainerHTML = document.querySelector("#face-btn-container");
    // faceBtnContainerHTML.innerHTML = `<i id="face-btn" class="far fa-smile"></i>`;
    const facrBtnHTML = document.querySelector("#face-btn");
    facrBtnHTML.className = "";
    facrBtnHTML.classList.add("far", "fa-smile");
  },
  showDigFace() {
    this.resetFace();
    const facrBtnHTML = document.querySelector("#face-btn");
    facrBtnHTML.classList.remove("fa-smile");
    facrBtnHTML.classList.add("fa-surprise");
  },
  adjustMainAreaSize() {
    const mainArea = document.querySelector("#main-area");
    const width = 35 * model.sizeCol + 43;
    mainArea.style.width = `${width}px`;
    const clickZone = document.querySelector("#click-zone");
    const height = 35 * model.sizeRow + 7;
    clickZone.style.height = `${height}px`;;
  },
}

const controller = {
  currentState: GAME_STATE.FirstClickAwaits,
  createGame() {
    this.resetGame();
    // Listener
    const clickZoneHTML = document.querySelector("#click-zone");
    // 整體順序應該為down out over up
    // 玩家可能移出click zone才放開滑鼠，所以用window
    window.addEventListener("mouseup", e => {
      const boxHTML = e.target.closest(".box");
      // 有點在box上才會啟動
      if (boxHTML !== null) {
        if (this.mouseClickMode() === 1 && !this.isFlaged(boxHTML) && !model.boxData[boxHTML.id]["isDigged"] && !model.isLeftClickingDisabled) {
          // 如果不是移除cover的狀態，就不會點開，防止右鍵移開時，已經取消click動作卻還是會點開
          // 改成左鍵沒有disabled

          // 第一次點擊：決定炸彈、數字、計時
          if (this.currentState === GAME_STATE.FirstClickAwaits) {
            this.firstClickAction(boxHTML.id);
          }

          this.digBox(boxHTML.id);
        } else if (this.mouseClickMode() === 3) {
          // 計算旗子數量和當下格子數字是否相同，相同則全部打開
          // 先做成全部還原??????用個count比較
          let flagCount = 0;
          const notFlagedBoxId = [];

          this.getNearBoxId(boxHTML.id).forEach(boxId => {
            if (!model.boxData[boxId]["isDigged"]) {
              const nearBoxHTML = document.querySelector(`#${boxId}`);
              nearBoxHTML.classList.add("covered-box");
              if (this.isFlaged(nearBoxHTML)) {
                flagCount++;
              } else {
                notFlagedBoxId.push(boxId);
              }
            }
          });
          // 如果是數字，且符合所點box的數字
          if (model.boxData[boxHTML.id]["type"] === flagCount) {
            notFlagedBoxId.forEach(boxId => {
              this.digBox(boxId);
            });
          }
        }

        // check win or lose
        model.checkLoseOrWin();

      }
      // 只要up全部清空，改為各自清空
      if (event.which === 1) {
        model.isLeftClicking = false;
        model.isLeftClickingDisabled = false;
      } else if (event.which === 3) {
        if (this.mouseClickMode() === 3) {
          model.isLeftClickingDisabled = true;
        }
        model.isRightClicking = false;
      }
      // 處理reset face
      if (this.mouseClickMode() === 0 && this.currentState !== GAME_STATE.GameFinished) {
        view.resetFace();
      }
    });
    // ----------------------------------------------------------------
    clickZoneHTML.addEventListener("mousedown", e => {
      const boxHTML = e.target.closest(".box");
      // 有點在box上才會啟動
      if (boxHTML === null || this.currentState === GAME_STATE.GameFinished) {
        return;
      }
      // event.which代表點滑鼠的左中右鍵
      // 負責管理點擊狀態
      if (event.which === 1) {
        model.isLeftClicking = true;
      } else if (event.which === 3) {
        model.isRightClicking = true;
      }
      // dig改變face
      if (event.which === 1 || event.which === 3) {
        view.showDigFace();
      }
      // 和mouseover有共用，但和nouseout有點不同
      // 增加旗子判斷
      if (this.mouseClickMode() === 1) {
        if (!this.isFlaged(boxHTML)) {
          boxHTML.classList.remove("covered-box");
        }
      } else if (this.mouseClickMode() === 2) {
        view.setFlag(boxHTML);
        view.showRemainBombNumber();
      } else if (this.mouseClickMode() === 3) {
        this.getNearBoxId(boxHTML.id).forEach(boxId => {
          const nearBoxHTML = document.querySelector(`#${boxId}`);
          if (!this.isFlaged(nearBoxHTML)) {
            nearBoxHTML.classList.remove("covered-box");
          }
        });
      }
    });
    // ----------------------------------------------------------------
    clickZoneHTML.addEventListener("mouseover", e => {
      const boxHTML = e.target.closest(".box");
      // 有點在box上才會啟動
      if (boxHTML === null) {
        return;
      }

      if (this.mouseClickMode() === 1 && !model.isLeftClickingDisabled) {
        if (!this.isFlaged(boxHTML)) {
          boxHTML.classList.remove("covered-box");
        }
      } else if (this.mouseClickMode() === 3) {
        this.getNearBoxId(boxHTML.id).forEach(boxId => {
          const nearBoxHTML = document.querySelector(`#${boxId}`);
          if (!this.isFlaged(nearBoxHTML)) {
            nearBoxHTML.classList.remove("covered-box");
          }
        });
      }
    });
    // ----------------------------------------------------------------
    clickZoneHTML.addEventListener("mouseout", e => {
      const boxHTML = e.target.closest(".box");
      // 有點在box上才會啟動
      if (boxHTML === null) {
        return;
      }
      // 尚未dig，會cover回去
      if (this.mouseClickMode() === 1 && !model.boxData[boxHTML.id]["isDigged"]) {
        boxHTML.classList.add("covered-box");
      } else if (this.mouseClickMode() === 3) {
        this.getNearBoxId(boxHTML.id).forEach(boxId => {
          if (!model.boxData[boxId]["isDigged"]) {
            const nearBoxHTML = document.querySelector(`#${boxId}`);
            nearBoxHTML.classList.add("covered-box");
          }
        });
      }
    });
    // ----------------------------------------------------------------
    // 阻止點右鍵跳出視窗
    window.oncontextmenu = function () {
      return false;
    };
    // face button for reset 左右鍵都可壓，但只有左鍵有功用
    const faceBtnContainerHTML = document.querySelector("#face-btn-container");
    faceBtnContainerHTML.addEventListener("mousedown", e => {
      faceBtnContainerHTML.classList.remove("border-style-outer");
      faceBtnContainerHTML.classList.add("border-style-inner");
      model.isFaceBtnLeftClicking = true;
    });
    window.addEventListener("mouseup", e => {
      faceBtnContainerHTML.classList.remove("border-style-inner");
      faceBtnContainerHTML.classList.add("border-style-outer");
      // 判斷要在face上放開才會有用
      console.log(e.target.closest("#face-btn-container"))
      console.log(e.target)
      if (e.target.closest("#face-btn-container") !== null && model.isFaceBtnLeftClicking) {
        this.resetGame();
      }
      model.isFaceBtnLeftClicking = false;
    });
    // customized Listener
    this.createCustomizedListener();
  },
  createBoxData() {
    // 初始狀態，預設為empty
    for (let i = 1; i <= model.sizeRow; i++) {
      for (let j = 1; j <= model.sizeCol; j++) {
        model.boxData[`box-${i}-${j}`] = {};
        model.boxData[`box-${i}-${j}`]["isDigged"] = false;
        model.boxData[`box-${i}-${j}`]["type"] = "empty";
      }
    }
  },
  mouseClickMode() {
    if (!model.isLeftClicking && !model.isRightClicking) {
      return 0;
    } else if (model.isLeftClicking && !model.isRightClicking) {
      return 1;
    } else if (!model.isLeftClicking && model.isRightClicking) {
      return 2;
    } else if (model.isLeftClicking && model.isRightClicking) {
      return 3;
    }
  },
  // get鄰近且包含自己的boxId，排除超出範圍的box
  getNearBoxId(boxId) {
    const row = +boxId.split("-")[1];
    const col = +boxId.split("-")[2];
    const nearBoxId = [];
    for (let i = Math.max(1, row - 1); i <= Math.min(model.sizeRow, row + 1); i++) {
      for (let j = Math.max(1, col - 1); j <= Math.min(model.sizeCol, col + 1); j++) {
        nearBoxId.push(`box-${i}-${j}`);
      }
    }
    return nearBoxId;
  },
  isFlaged(boxHTML) {
    return boxHTML.querySelector(".fa-flag") !== null
  },
  digBox(boxId) {
    // 有旗子就return
    const boxHTML = document.querySelector(`#${boxId}`);
    if (this.isFlaged(boxHTML) || model.boxData[boxHTML.id]["isDigged"]) {
      return;
    }
    // Digged
    boxHTML.classList.remove("covered-box");
    model.boxData[boxHTML.id]["isDigged"] = true;
    // 依照type顯示
    switch (model.boxData[boxId].type) {
      case "bomb":
        model.bombDigged.push(boxHTML);
        break;
      case "empty":
        this.getNearBoxId(boxId).forEach(nearBoxId => {
          this.digBox(nearBoxId);
        });
        break;
      default:
        boxHTML.innerHTML = model.boxData[boxId].type;
        this.addNumberColorClass(boxId);
    }
  },
  // bomb
  createBombPositionArrayAndRecordBoxType(firstClickBoxId) {
    for (let i = 1; i <= model.bombNumber; i++) {
      const randomBombBoxId = this.createRandomBombBoxId(firstClickBoxId);
      model.bombPosition.push(randomBombBoxId);
      model.boxData[randomBombBoxId]["type"] = "bomb";
    }
  },
  createRandomBombBoxId(firstClickBoxId) {
    const avoidBombPosition = this.getNearBoxId(firstClickBoxId);
    const row = Math.floor(Math.random() * model.sizeRow) + 1;
    const col = Math.floor(Math.random() * model.sizeCol) + 1;
    const randomBombBoxId = `box-${row}-${col}`;
    if (avoidBombPosition.includes(randomBombBoxId) || model.bombPosition.includes(randomBombBoxId)) {
      return this.createRandomBombBoxId(firstClickBoxId);
    }
    return randomBombBoxId;
  },
  // number
  calculateBoxNumberAndRecordBoxType(bombArray) {
    bombArray.forEach(bombId => {
      const nearBoxesIdArray = this.getNearBoxId(bombId);
      nearBoxesIdArray.forEach(boxId => {
        if (model.boxData[boxId]["type"] !== "bomb" && model.boxData[boxId]["type"] === "empty") {
          model.boxData[boxId]["type"] = 1;
        } else if (model.boxData[boxId]["type"] !== "bomb" && model.boxData[boxId]["type"] !== "empty") {
          model.boxData[boxId]["type"]++;
        }
      });
    });
  },
  addNumberColorClass(boxId) {
    const boxHTML = document.querySelector(`#${boxId}`);
    const number = model.boxData[boxId]["type"];
    const className = `color-number-${number}`;
    boxHTML.classList.add(className);
  },
  firstClickAction(boxId) {
    // 決定炸彈
    this.createBombPositionArrayAndRecordBoxType(boxId);
    // 決定數字
    this.calculateBoxNumberAndRecordBoxType(model.bombPosition);
    // 計時
    model.timeCounter = setInterval(function () {
      controller.countTime();
      view.showCountTime();
    }, 1000)
    // 狀態變更
    this.currentState = GAME_STATE.GamePlaying;
  },

  countTime() {
    model.countTime++;
  },
  calculateRemainBombNumber() {
    let countFlagNumber = 0;
    for (let i = 1; i <= model.sizeRow; i++) {
      for (let j = 1; j <= model.sizeCol; j++) {
        const boxHTML = document.querySelector(`#box-${i}-${j}`);
        if (boxHTML.querySelector(".fa-flag")) {
          countFlagNumber++;
        }
      }
    }
    return model.bombNumber - countFlagNumber;
  },

  resetGame() {
    this.resetBomb();
    this.resetBoxData();
    this.resetTime();

    view.buildClickZone();
    this.createBoxData();
    view.showCountTime();
    view.showRemainBombNumber();
    view.resetFace();
    controller.currentState = GAME_STATE.FirstClickAwaits;
  },
  resetTime() {
    clearInterval(model.timeCounter);
    model.countTime = 0;
  },
  resetBomb() {
    model.bombPosition.splice(0, model.bombPosition.length);
    model.bombDigged.splice(0, model.bombDigged.length);
  },
  resetBoxData() {
    for (let boxId in model.boxData) {
      delete model.boxData[boxId];
    }
  },

  createCustomizedListener() {
    // 客製化區域
    const customizedCreateBtn = document.querySelector("#customized-create-btn");
    const customizedInputRow = document.querySelector("#customized-input-row");
    const customizedInputCol = document.querySelector("#customized-input-col");
    const customizedInputBombNumber = document.querySelector("#customized-input-bomb-number");
    customizedCreateBtn.addEventListener("click", function (e) {
      const inputRow = +customizedInputRow.value;
      const inputCol = +customizedInputCol.value;
      const inputBombNumber = +customizedInputBombNumber.value;
      if (isNaN(inputRow) || isNaN(inputCol) || isNaN(inputBombNumber)) {
        alert("拜託輸入數字!");
        customizedInputRow.value = "";
        customizedInputCol.value = "";
        customizedInputBombNumber.value = "";
        return;
      } else if (inputRow % 1 !== 0 || inputCol % 1 !== 0 || inputBombNumber % 1 !== 0) {
        alert("可以輸入整數嗎?");
        customizedInputRow.value = "";
        customizedInputCol.value = "";
        customizedInputBombNumber.value = "";
        return;
      } else if (inputRow < 0 || inputCol < 0 || inputBombNumber < 0) {
        alert("不要輸入負數!");
        customizedInputRow.value = "";
        customizedInputCol.value = "";
        customizedInputBombNumber.value = "";
        return;
      } else if (inputRow <= 3 || inputCol <= 3) {
        alert("這樣太簡單了，建議大一點!");
        customizedInputRow.value = "";
        customizedInputCol.value = "";
      } else if (inputRow * inputCol - inputBombNumber < 9) {
        alert("炸彈太多塞不下啦!");
        customizedInputBombNumber.value = "";
      } else if (inputBombNumber <= 0) {
        alert("你沒有放地雷，還叫踩地雷嗎?");
        customizedInputBombNumber.value = "";
      } else {
        // 建議別太窄，因為版型會跑掉
        if (inputCol <= 7) {
          alert("建議寬一點，因為版型會跑掉XD");
        }
        if (inputRow >= 50 || inputCol >= 50) {
          alert("真的太大了!拜託小一點~");
          customizedInputRow.value = "";
          customizedInputCol.value = "";
          return;
        } else if (inputRow >= 30 || inputCol >= 30) {
          alert("太大了吧!但還是可以玩~");
        }
        // 輸入設定
        model.sizeRow = inputRow;
        model.sizeCol = inputCol;
        model.bombNumber = inputBombNumber;
        controller.resetGame();
        view.adjustMainAreaSize();
      }

    });
  },
}

const utility = {
  createDigitalClockNumber(targetHTML, number) {
    // 先確認高度
    let numberHeight = targetHTML.clientHeight;
    // 保有基本高度
    if (numberHeight === 0) {
      numberHeight = 200;
    }

    const numberHTML = this.createDigitalClockNumberTemplate(numberHeight);
    this.clearNumberPart(numberHTML);
    this.showNumber(numberHTML, number);

    return numberHTML;
  },
  createDigitalClockNumberTemplate(numberHeight) {

    const digitalClockNumberTemplateHTML = document.createElement("div");
    digitalClockNumberTemplateHTML.classList.add("number-template");
    // templateHeight等下要修改，參考外面高度，unit為px
    const templateHeight = numberHeight;
    digitalClockNumberTemplateHTML.style.height = `${templateHeight}px`;
    digitalClockNumberTemplateHTML.style.width = `calc(${templateHeight}px * 0.5)`;
    // 內部組成，分7個部分
    for (let i = 1; i <= 7; i++) {
      const partHTML = document.createElement("div");
      partHTML.classList.add("number-part", `number-part-${i}`);

      const component1HTML = document.createElement("div");
      component1HTML.style.borderWidth = `${templateHeight * 0.05}px`;
      component1HTML.classList.add("number-part-component", "number-part-component-1");

      const component2HTML = document.createElement("div");
      component2HTML.style.borderWidth = `${templateHeight * 0.05}px`;
      component2HTML.classList.add("number-part-component", "number-part-component-2");

      partHTML.append(component1HTML);
      partHTML.append(component2HTML);

      digitalClockNumberTemplateHTML.append(partHTML);
    }

    return digitalClockNumberTemplateHTML;
  },
  clearNumberPart(numberHTML) {
    for (let i = 1; i <= 7; i++) {
      const partClass = `number-part-${i}`;
      const partHTML = numberHTML.querySelector(`.${partClass}`);
      const component1HTML = partHTML.querySelector(".number-part-component-1");
      const component2HTML = partHTML.querySelector(".number-part-component-2");
      component1HTML.style.borderBottomColor = "rgba(255, 0, 0, 0.2)";
      component2HTML.style.borderTopColor = "rgba(255, 0, 0, 0.2)";
    }
  },
  showNumber(numberHTML, number) {
    const showPart = {
      0: [1, 2, 3, 5, 6, 7],
      1: [3, 6],
      2: [1, 3, 4, 5, 7],
      3: [1, 3, 4, 6, 7],
      4: [2, 3, 4, 6],
      5: [1, 2, 4, 6, 7],
      6: [1, 2, 4, 5, 6, 7],
      7: [1, 3, 6],
      8: [1, 2, 3, 4, 5, 6, 7],
      9: [1, 2, 3, 4, 6, 7],
    };

    const showPartArray = showPart[number];
    showPartArray.forEach(part => {
      const partClass = `number-part-${part}`;
      const partHTML = numberHTML.querySelector(`.${partClass}`);
      const component1HTML = partHTML.querySelector(".number-part-component-1");
      const component2HTML = partHTML.querySelector(".number-part-component-2");
      component1HTML.style.borderBottomColor = "rgba(255, 0, 0, 1)";
      component2HTML.style.borderTopColor = "rgba(255, 0, 0, 1)";
    });

  },
}

//////////////////////////////////////////
controller.createGame();

