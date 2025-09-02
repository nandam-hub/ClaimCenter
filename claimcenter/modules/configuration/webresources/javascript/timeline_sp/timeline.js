function addLinksToSummary(summary, links, summaryCell) {
    links = links.slice()
    var regexLocateLinks = /<#([0-9]+)\%((?:[^%]|%[^>])+)\%>/g;
    var start = 0;
    var i = 0;
    var linkedTextArray;
    while ((linkedTextArray = regexLocateLinks.exec(summary)) !== null) {
        summaryCell.append(summary.substring(start, linkedTextArray.index));
        var index = linkedTextArray[1];
        var found = false;
        for (var j = 0; j < links.length; j++) {
            if (links[j].Sequence == index) {
                summaryCell.append($("<a>", {class: "link", href: links[j].url}).text(linkedTextArray[2]));
                links.splice(j, 1);
                found = true;
                break;
            }
        }
        if (!found){
            summaryCell.append(linkedTextArray[2])
        }
        start = regexLocateLinks.lastIndex;
        i++
    }
    if (start != summary.length) {
        summaryCell.append(summary.substring(start))
    }
    return summaryCell
}

function categoryVisible(entry) {
    var isVisible = false;
    categories.forEach(function (n) {
        isVisible = isVisible || ((entry.Category.Code == n.Code) && n.selected)
    });
    return isVisible
}

function relatedToVisible(entry) {
    var isVisible = true;
    var types = [exposures, contacts, services, matters]
    for (var i = 0; i < types.length; i++) {
        var type = types[i]
        if (type.selectedBeanID != type.noChoiceText) {
            var foundMatch = false
            for (var j = 0; j < entry.links.length; j++) {
                var link = entry.links[j]
                if ((link.relatedToType == type.filterID) && (link.BeanID == type.selectedBeanID)) {
                    foundMatch = true
                    break
                }
            }
            isVisible = isVisible && foundMatch
        }
    }
    return isVisible
}


function importanceVisible(entry) {
    return entry.Importance.Priority >= currentImportance
}

function visible(entry) {
    return importanceVisible(entry)
        && categoryVisible(entry)
        && relatedToVisible(entry)
}

var categories = allCategories.map(function (item) {
        item.selected = true;
        return item
    }
);


function Timeline(data) {
    var that = this
    this.hasMore = data.hasMore
    this.nextStartingIndex = data.nextStartingIndex
    this.pageSize = pageSize
    this.entries = data.entries
    this.iterator = function () { return new TimelineIterator(that) }
    this.page = function (callback) {
        if (that.hasMore) {
            $.get(getQueryString(pageSize, that.nextStartingIndex, that.lastEntryID), function(data) {
                if (!data.hasMore) {
                    that.hasMore = false
                }
                that.entries = Timeline.entries.concat(data.entries)
                that.nextStartingIndex = data.nextStartingIndex
                that.lastEntryID = data.entries[data.entries.length - 1].publicID
                if (typeof callback !== "undefined") {
                    callback()
                }
            }, "json")
        } else {
            if (typeof callback !== "undefined") {
                callback()
            }
        }
    }
}

function TimelineIterator(timeline) {
    var iterator = this
    this.index = 0
    this.next = function () {
        if (iterator.index >= timeline.entries.length) {
            return null
        }
        var entry = timeline.entries[iterator.index]
        iterator.index += 1
        return entry
    }
}


function updateButtonVisibility() {
    if (!Timeline.hasMore) {
        showMore.hide()
        createMessage.show()
    }
}

function createEntryDOMElement(entry) {
    var node = $("<div>", {class: "entry", id: entry.uiID})
    node.append($("<div>", {class: "time cell"}).text(entry.time))
    var icon_wrapper = $("<div>", {class: "timeline-icon cell"})
    icon_wrapper.append(Icon.view(Icon.controller({type: entry.Category.Code})))
    node.append(icon_wrapper)
    var summaryCell = $("<div>", {class: "summary cell"})
    addLinksToSummary(entry.Summary, entry.links, summaryCell)
    node.append(summaryCell)
    return node
}

function createDayDOMElement(entry) {
    var node = $("<div>", {class: "day", id: entry.dateForJump})
    node.append($("<div>", {class: "date cell"}).text(entry.date))
    return node
}

function doUIUpdate(iterator) { // this iterator should not do paging
    var timelineContainer = $("#timeline-container")
    timelineContainer.css("cursor", "wait")
    var day = {date: null, node: null}
    var entry = iterator.next()
    var currentDayVisible = false
    while (entry != null) {
        if (typeof entry.node === "undefined") {
            if (day.date == null) {
                day.date = entry.date
                day.node = createDayDOMElement(entry)
            } else if (day.date != entry.date) {
                day.date = entry.date
                if (currentDayVisible) {
                    day.node.show()
                } else {
                    day.node.hide()
                }
                currentDayVisible = false
                timelineWrapper.append(day.node)
                day.node = createDayDOMElement(entry)
            }
            entry.node = createEntryDOMElement(entry)
        } else {
            if (day.date == null) {
                day.date = entry.date
                day.node = entry.node.parent()
            } else if (day.date != entry.date) {
                day.date = entry.date
                if (currentDayVisible) {
                    day.node.show()
                } else {
                    day.node.hide()
                }
                currentDayVisible = false
                day.node = entry.node.parent()
            }
        }
        if (entry.isVisible) {
            entry.node.show()
            currentDayVisible = currentDayVisible || entry.isVisible
        } else {
            entry.node.hide()
        }
        day.node.append(entry.node)
        entry = iterator.next()
    }
    if (day.node != null) {
        timelineWrapper.append(day.node)
        if (currentDayVisible) {
            day.node.show()
        } else {
            day.node.hide()
        }
    }
    updateButtonVisibility()
    timelineContainer.css("cursor", "")
}


function updateNoMatchesTextVisibility(visibleEntryCount) {
    if ((visibleEntryCount == 0) && (waitMessage == "")) {
        $("#noMatches").show()
    } else {
        $("#noMatches").hide()
    }
}


var filterWrapper = {};

filterWrapper.controller = function () {
    return {
        model: {
            categories: categories,
            contactsCategories: contacts,
            exposuresCategories: exposures,
            mattersCategories: matters,
            servicesCategories: services
        }
    }
}
var currentImportance = 0
if (typeof localStorage[storagePrefix + "Importance"] !== "undefined") {
    currentImportance = parseInt(localStorage[storagePrefix + "Importance"])
}

var slider = $("<input>", {id :"slider",
    type : "range",
    min: 0,
    max: importanceCodes.length - 1,
    step: 1,
    value: currentImportance
}).change(function () {
        currentImportance = this.value
        localStorage[storagePrefix + "Importance"] = String(currentImportance)
        updateVisibility()
        doUIUpdate(Timeline.iterator())
    }
)
slider.css('margin-top', '10px')
var numImportanceCodes = importanceCodes.length
var labelDiv = $("<div>", {id: 'sliderLabelDiv'})
labelDiv.append($("<div>", {id: 'sliderLabelLeft', text: importanceCodes[0].name}))
for (var i = 1; i < numImportanceCodes - 1; i++) {
    var currInnerDiv = $("<div>", {class: 'sliderLabelMiddle'}).css('left', (i/(numImportanceCodes - 1) * 100) + "%")
    currInnerDiv.append($("<div>", {class: 'sliderLabelMiddleInner', text: importanceCodes[i].name}))
    labelDiv.append(currInnerDiv)
}
if (numImportanceCodes > 1) {
    labelDiv.append($("<div>", {id: 'sliderLabelRight', text: importanceCodes[numImportanceCodes - 1].name}))
}
var sliderWrapper = $("<div>")
    .append($("<div>", {id: 'importanceLabel', text: importanceLabel}))
    .append(slider)
    .append(labelDiv)

filterWrapper.view = function (control) {
    var wrapper = $("<div>", {class: "filters"})
    wrapper.append(Filter.view(Filter.controller({categories: control.model.categories})))
    wrapper.append($(".relatedToTitle").text(relatedToTitle))
    wrapper.append(RelatedToFilter.view(RelatedToFilter.controller(control.model.contactsCategories)))
    wrapper.append(RelatedToFilter.view(RelatedToFilter.controller(control.model.exposuresCategories)))
    wrapper.append(RelatedToFilter.view(RelatedToFilter.controller(control.model.servicesCategories)))
    wrapper.append(sliderWrapper)
    wrapper.append($("<hr>"))
    return wrapper
};

//filter
var Filter = {}
Filter.controller = function (options) {
    return {
        model: {
            categories: options.categories
        }
    }
}

Filter.view = function (control) {
    var categoryWrapper = $("<div>", {class: "categories"})
    control.model.categories.map(function (item) {
        var categoryLabel = $("<label>")
        var presetChecked = localStorage[storagePrefix+"categories"+item.Code]
        if (typeof presetChecked !== "undefined") {
            item.selected = JSON.parse(presetChecked)
        }
        var checkbox = $("<input>",
            {type: "checkbox", checked: item.selected, name: item.Code})
        checkbox.change(function () {
            item.selected = this.checked
            localStorage[storagePrefix+"categories"+item.Code] = this.checked
            updateVisibility()
            doUIUpdate(Timeline.iterator())
        })
        categoryLabel.append(checkbox)
        categoryLabel.append($("<div>",
            {class: "iconFilterWrapper"}).append(Icon.view(Icon.controller({type: item.Code}))))
        categoryLabel.append(item.DisplayName)
        categoryWrapper.append($("<div>", {class: "category"}).append(categoryLabel))
    })
    return categoryWrapper

}

// relatedToFilter
var RelatedToFilter = {}

RelatedToFilter.controller = function (options) {
    return {
        model: {
            relatedTo: options
        }
    }
}

RelatedToFilter.view = function (control) {
    var presetSelected = localStorage[storagePrefix+"relatedTo"+control.model.relatedTo.filterID]
    if (typeof presetSelected !== "undefined") {
        control.model.relatedTo.selectedBeanID = presetSelected
    }
    var dropDownMenu = $("<select>")
    dropDownMenu.change(function () {
        control.model.relatedTo.selectedBeanID = $(this).val()
        localStorage[storagePrefix+"relatedTo"+control.model.relatedTo.filterID] = $(this).val()
        updateVisibility()
        doUIUpdate(Timeline.iterator())
    })
    dropDownMenu.append($("<option>",
        {value: control.model.relatedTo.noChoiceText,
            text: control.model.relatedTo.noChoiceText}))
    control.model.relatedTo.choices.map(function (choice) {
        dropDownMenu.append($("<option>",
            {value: choice.BeanID,
                text: choice.DisplayName}))
    })
    dropDownMenu.val(control.model.relatedTo.selectedBeanID)
    return $("<div>").append(dropDownMenu)
}

function chooseIcon(code) {
    var symbol = ""
    if (code == categoryCodes.activities) {
        symbol = "fa-check"
    } else if (code == categoryCodes.financials) {
        symbol = "fa-usd"
    } else if (code == categoryCodes.notes) {
        symbol = "fa-sticky-note-o"
    } else if (code == categoryCodes.services) {
        symbol = "fa-wrench"
    } else if (code == categoryCodes.documents) {
		symbol = "fa-file"
	}
    return symbol
}


//icon
var Icon = {}
Icon.controller = function (options) {
    return {
        type: options.type
    }
}

Icon.view = function (control) {
    return $("<span>", {class: "categoryIcon " + control.type}).append(
        $("<i>", {class: "fa " + chooseIcon(control.type)}))

}

function jumpToDateFunction(iterator, searchDate) {
    var entry = iterator.next();
    entry.isVisible = visible(entry)
    var backupEntry = null
    if(entry !== null) {
        var entryDate = getJumpToDate(entry);
        while(entryDate > searchDate || !entry.isVisible) {
            backupEntry = entry;
            entry = iterator.next();
            if(entry == null) {
                if(Timeline.hasMore) {
                    showMoreEntries(function() { jumpToDateFunction(iterator, searchDate)});
                    return;
                } else if(backupEntry != null) {
                    scrollToId(backupEntry.uiID);
                    return;
                } else {
                    break;
                }
            } else {
                entry.isVisible = visible(entry);
                entryDate = getJumpToDate(entry);
            }
        }
    }
    if(entry != null) {
        scrollToId(entry.uiID)
    } else {
        if(backupEntry != null) {
            scrollToId(backupEntry.uiID)
        }
    }
}

function getJumpToDate(entry) {
    var datePattern = /([0-9][0-9])([0-9][0-9])([0-9]{4})/gi
    var matches = datePattern.exec(entry.dateForJump)
    if(matches.length == 4) {
        return new Date(matches[3], matches[2] - 1, matches[1])
    } else {
        return null
    }
}

function updateVisibility(iterator, index) {
    if(iterator == null) {
        updateVisibility(Timeline.iterator(), 0)
        return
    }
    var visibleFound = index
    var callback = function() {
        updateVisibility(iterator, visibleFound)
    }
    var entry = iterator.next()
    while(entry != null) {
        entry.isVisible = visible(entry)
        if(entry.isVisible) {
            visibleFound++
        }
        entry = iterator.next()
    }
    if ((visibleFound < MIN_VISIBLE) && Timeline.hasMore) {
        Timeline.page(callback)
    }
    updateNoMatchesTextVisibility(visibleFound)
}


var showMore = $("<button>", {type: "button", text: showMoreButtonText})
showMore.click(function() {
    showMoreEntries(function(){})

})

function showMoreEntries(callback) {
    Timeline.page(function() {
        updateVisibility()
        doUIUpdate(Timeline.iterator())
        callback()
    })
}


function timelineScrollListener() {
}

function initialScroll() {
    var entryId = localStorage[storagePrefix+"entry"]
	if (jumpToDateYear !== null && jumpToDateMonth !== null && jumpToDateDay !== null) {
	  localStorage.removeItem(storagePrefix+"entry")
	  var jumpToDateForScript = new Date(jumpToDateYear, jumpToDateMonth, jumpToDateDay)
      jumpToDateFunction(Timeline.iterator(), jumpToDateForScript);
    } else if (typeof entryId === "undefined") {
      return
    } else {
      scrollToId(entryId)
    }
}

function scrollToId(givenId) {
    var startingEntry = $("#" + givenId)
    if (startingEntry.length == 0 && Timeline.hasMore) {
        showMoreEntries(function() {
            scrollToId(givenId)
        })
        return
    } else if(startingEntry.length > 0) {
        var panel = $("#timeline-scroll")
        localStorage[storagePrefix+"entry"] = givenId
        panel.animate({ scrollTop: startingEntry.position().top  + panel.scrollTop()}, 1000);
    }
}

var height = $(window).innerHeight() - $("#timeline-container").offset().top
$("#timeline-container").height(height)

var createMessage = $("<div>", {text: claimCreateMessage}).hide()

var buttonWrapper = $("<div>", {class: "button-wrapper"})
    .append($("<div>", {text: waitMessage}))
    .append(showMore)
    .append($("<div>", {id: "noMatches", text: noMatchesText}).hide())
    .append(createMessage)

function getQueryString(pageSize, startingIndex, lastEntryID) {
    var queryString =  servlet_path_prefix + servlet_path + "?claimNumber=" + claimNumber
        + "&pageSize=" + String(pageSize)
        + "&startingIndex=" + String(startingIndex)
    if (lastEntryID) {
        queryString += "&lastEntryID=" + lastEntryID
    }
    return queryString
}

var timelineWrapper = $("<div>", {class: "timeline-wrapper"})

function initialLoad() {
    $.get(getQueryString(pageSize, 0), function(data) {
        Timeline = new Timeline(data) //only one Timeline can exist
        $("#timeline-container")
            .append($("<div>",{id: "timeline-scroll"}).append($("<div>", {id: "timeline"})
                .append(timelineWrapper)
                .append(buttonWrapper)))
            .append(filterWrapper.view(filterWrapper.controller()));

        $("#timeline-scroll").scroll(timelineScrollListener)

        window.addEventListener('resize', function(event){
            var height = $(window).innerHeight() - $("#timeline-container").offset().top
            $("#timeline-container").height(height)
        });

        updateVisibility()
        doUIUpdate(Timeline.iterator())
        initialScroll()
    }, "json")
}
initialLoad()



