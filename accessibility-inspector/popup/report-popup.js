var isAllIssusesElementsExpanded = true;

const popupBodyReport = document.getElementById("popup-body-report");

const summaryUrl = document.getElementById("summary--about--showurl");
const summaryDatetime = document.getElementById("summary--about--showdatetime");
const summaryTotalIssuses = document.getElementById("summary--about--total");
const summaryWarnings = document.getElementById("summary--about--warnings");
const summaryErrors = document.getElementById("summary--about--errors");

const selectorByIssuseTypes = document.getElementById("selector-by-issuse-types");
const selectorByCategories = document.getElementById("selector-by-categorys");
const btnAcceptFilters = document.getElementById("btn-accept-filters");
const btnResetFilters = document.getElementById("btn-reset-filters");
const btnExpandIssuses = document.getElementById("btn-expand-issuses");


function createPairConstructElement(title, value, colorValue){
    let colorDiv = document.createElement("div");
    colorDiv.classList.add("issuses__list__details__color__container");
    let titltColor = document.createElement("strong");
    titltColor.innerText = title + (value ? ": " : "");
    colorDiv.appendChild(titltColor);
    if (value){
        let valueContainer = document.createElement("span");
        valueContainer.style = `display: inline-flex;flex-direction: row;align-items: center;`
        let valueShowed = document.createElement("p");
        valueShowed.innerText = value;
        valueContainer.appendChild(valueShowed);
        if (colorValue){
            let colorShowed = document.createElement("div");
            colorShowed.classList.add("issuses__list__details__color__container__show");
            colorShowed.style.backgroundColor = colorValue;
            valueContainer.appendChild(colorShowed);
        }
        colorDiv.appendChild(valueContainer);
    }
    return colorDiv;
}



function generateIssuse(position, issuse){
    /* Создает развертывающийся виджет для единичной проблемы */
    const cnt_category = Object.hasOwn(issuse, "category") ? issuse.category : "Категория не указана";
    const cnt_element = Object.hasOwn(issuse, "element") ? issuse.element : null;
    const cnt_message = (Object.hasOwn(issuse, "message") ? issuse.message : "Сообщение отсутсвует");
    const cnt_selector = Object.hasOwn(issuse, "selector") ? issuse.selector : null;
    const cnt_type = Object.hasOwn(issuse, "type") ? issuse.type : "Не указано";

    let details = document.createElement("details");
    details.setAttribute("data-category", cnt_category);
    details.setAttribute("data-issuse-type", cnt_type);
    details.classList.add("issuses__list__details");
    details.id = "issuses__list__issuse__" + position;
    let summary = document.createElement("summary");
    summary.classList.add("issuses__list__details__summary__issuses");
    switch (cnt_type) {
        case "error":
            summary.classList.add("issuses__list__details__summary__issuse__error");
            break;
        case "warning":
            summary.classList.add("issuses__list__details__summary__issuse__warnign");
            break;
        default:
            summary.classList.add("issuses__list__details__summary__issuse__default");
            break;
    }
    let summary_container = document.createElement("span");
    summary_container.classList.add("issuses__list__details__title");
    let category_span = document.createElement("h3");
    category_span.innerHTML = "Issue: " + position + " > <strong>Category</strong>: " + cnt_category;
    let span_issuse_type = document.createElement("span");
    span_issuse_type.innerText = cnt_type;
    summary_container.appendChild(category_span);
    summary_container.appendChild(span_issuse_type);
    summary.appendChild(summary_container);
    details.appendChild(summary);

    let details_containet = document.createElement("div");

    if (cnt_selector){
        details_containet.appendChild(createPairConstructElement("Selector", cnt_selector));
    }

    details_containet.classList.add("issuses__list__details__container");
    let p_message_title = document.createElement("strong");
    p_message_title.innerText = "Message:";
    details_containet.appendChild(p_message_title);
    let p_message_text = document.createElement("p")
    p_message_text.innerText = cnt_message;
    details_containet.appendChild(p_message_text);
    
    if (cnt_element){
        let label_for_element_code = document.createElement("p");
        label_for_element_code.innerHTML = "<strong>Element code</strong>:";
        details_containet.appendChild(label_for_element_code);
        let element_code = document.createElement("code");
        element_code.classList.add("issuses__list__details__code");
        element_code.innerText = cnt_element;
        details_containet.appendChild(element_code);
    }
    

    if (cnt_category == "contrast"){
        let hrAfterCode = document.createElement("hr");
        hrAfterCode.style = "width: -webkit-fill-available;";
        details_containet.appendChild(hrAfterCode);
        details_containet.appendChild(createPairConstructElement("Contrast parameters"));

        let contrastParametersContainer = document.createElement("div");
        contrastParametersContainer.style = "margin-left: .7rem;"

        contrastParametersContainer.appendChild(createPairConstructElement(
            "Score", issuse.details.suggestions.score
        ));

        contrastParametersContainer.appendChild(createPairConstructElement("Background element:"));

        let listBackColorShowed = document.createElement("ul");
        [
            createPairConstructElement(
                "backroundColor", issuse.details.backgroundColor, issuse.details.backgroundColor),
            createPairConstructElement(
                "textColor", issuse.details.textColor, issuse.details.textColor),
            createPairConstructElement(
                "fontSize", issuse.details.fontSize),
            createPairConstructElement(
                "fontWeight", issuse.details.fontWeight),
            createPairConstructElement(
                "ratio", issuse.details.ratio),
            createPairConstructElement(
                "requiredRatio", issuse.details.requiredRatio)
        ].forEach(item => {
            let itemShowed = document.createElement("li");
            itemShowed.appendChild(item);
            listBackColorShowed.appendChild(itemShowed);
        })
        contrastParametersContainer.appendChild(listBackColorShowed);
        details_containet.appendChild(contrastParametersContainer);

        

        if (issuse.details.suggestions){
            contrastParametersContainer.appendChild(createPairConstructElement("Suggestions:"));

            let suggestionDiv = document.createElement("div");
            suggestionDiv.style = "margin-left: 1rem;"
            suggestionDiv.appendChild(
                createPairConstructElement(
                    "Improvement", issuse.details.suggestions.improvement))
            suggestionDiv.appendChild(document.createElement("hr"));
            suggestionDiv.appendChild(
                createPairConstructElement(
                    "Current color", issuse.details.suggestions.current, issuse.details.suggestions.current))
            suggestionDiv.appendChild(
                createPairConstructElement(
                    "Suggestion color", issuse.details.suggestions.suggested, issuse.details.suggestions.suggested))
            suggestionDiv.appendChild(document.createElement("hr"));
            suggestionDiv.appendChild(
                createPairConstructElement(
                    "Current ratio", issuse.details.suggestions.currentRatio))
            suggestionDiv.appendChild(
                createPairConstructElement(
                    "Suggestion ratio", issuse.details.suggestions.suggestedRatio))
            contrastParametersContainer.appendChild(suggestionDiv);
        }
    }
    details.appendChild(details_containet);
    return details;
}

function showDetailsIssuses(issuses){
    const issusesList = document.getElementById("issuses__list");
    issuses.forEach((element, i) => {
        issusesList.appendChild(generateIssuse(i, element));
    });

}

function getReportAsHTML(){
}

function initSelectorsForSorting(issusesElements){
    let issuseTypes = new Set([...issusesElements].map((item) => item.getAttribute("data-issuse-type")));
    issuseTypes.forEach((item, i) => {
        let opt = document.createElement("option");
        opt.innerText = item;
        opt.value = item;
        selectorByIssuseTypes.appendChild(opt);
    });
    let categoryTypes = new Set([...issusesElements].map((item) => item.getAttribute("data-category")));
    categoryTypes.forEach((item, i) => {
        let opt = document.createElement("option");
        opt.innerText = item;
        opt.value = item;
        selectorByCategories.appendChild(opt);
    });
}

function checkIsAllExpanedElements(elements){
    let isAllExpanded = true;
    [...elements].forEach(item => {
        if (item.hasAttribute("open")){
            isAllExpanded = false;
        }
    });
    return isAllExpanded;     
}

function init(reportData){
    summaryUrl.innerText = reportData.url;
    summaryUrl.setAttribute("href", reportData.url);
    summaryDatetime.innerText = (new Date(reportData.timestamp)).toLocaleString('ru-RU');
    summaryTotalIssuses.innerText = reportData.summary.total;
    summaryWarnings.innerText = reportData.summary.warnings;
    summaryErrors.innerText = reportData.summary.errors;
    showDetailsIssuses(reportData.issues);

    const issusesElements = document.getElementsByClassName("issuses__list__details");
    [...issusesElements].forEach(item => {
        item.addEventListener("click", function() {
            setTimeout(() => {
                isAllIssusesElementsExpanded = checkIsAllExpanedElements(issusesElements);
                btnExpandIssuses.innerText = isAllIssusesElementsExpanded ? "Expand all" : "Hide All";
            }, 5)
            
        })
    });

    initSelectorsForSorting(issusesElements);

    btnAcceptFilters.addEventListener("click", function() {
        let filtersElements = [...issusesElements];
        let categoryValue = selectorByCategories.value;
        let issuseTypeValue = selectorByIssuseTypes.value;
        filtersElements.forEach((item) => {
            item.classList.add("hidden");
        });
        if (categoryValue != "null"){
            filtersElements = filtersElements.filter(item => 
                item.getAttribute("data-category") === categoryValue
            );
        }
        if (issuseTypeValue != "null"){
            filtersElements = filtersElements.filter(item => 
                item.getAttribute("data-issuse-type") === issuseTypeValue
            );
        }
        filtersElements.forEach((item) => {
            item.classList.remove("hidden");
        });
    });
    btnResetFilters.addEventListener("click", function() {
        let filtersElements = [...issusesElements];
        filtersElements.forEach(item => {
            item.classList.remove("hidden");
        })
        selectorByCategories.value = "null";
        selectorByIssuseTypes.value = "null";
    });
    btnExpandIssuses.addEventListener("click", function() {
        [...issusesElements].forEach(item => {
            item.toggleAttribute("open", isAllIssusesElementsExpanded);
        });
        isAllIssusesElementsExpanded = !isAllIssusesElementsExpanded;
        btnExpandIssuses.innerText = isAllIssusesElementsExpanded ? "Expand all" : "Hide All";
    });   
}