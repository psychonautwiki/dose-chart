/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
goog.module('ddc');
var module = module || { id: 'ddc.ts' };
/**
 * @record
 */
function DoseDTO() { }
/** @type {!Data} */
DoseDTO.prototype.data;
/**
 * @record
 */
function Data() { }
/** @type {!Array<!SubstancesItem>} */
Data.prototype.substances;
/**
 * @record
 */
function SubstancesItem() { }
/** @type {string} */
SubstancesItem.prototype.name;
/** @type {!Array<!RoasItem>} */
SubstancesItem.prototype.roas;
/**
 * @record
 */
function RoasItem() { }
/** @type {!Dose} */
RoasItem.prototype.dose;
/** @type {string} */
RoasItem.prototype.name;
/**
 * @record
 */
function Dose() { }
/** @type {!Common} */
Dose.prototype.common;
/** @type {!Light} */
Dose.prototype.light;
/** @type {!Strong} */
Dose.prototype.strong;
/** @type {number} */
Dose.prototype.threshold;
/** @type {string} */
Dose.prototype.units;
/**
 * @record
 */
function Common() { }
/** @type {number} */
Common.prototype.min;
/**
 * @record
 */
function Light() { }
/** @type {number} */
Light.prototype.min;
/**
 * @record
 */
function Strong() { }
/** @type {number} */
Strong.prototype.min;
/** @type {number} */
Strong.prototype.max;
var SubstanceAPI = /** @class */ (function () {
    function SubstanceAPI() {
        this._apiDoseQuery = function (substanceName) {
            return "https://api.psychonautwiki.org/?query=%7Bsubstances(query%3A%22" + substanceName + "%22)%7Bname%20roas%7Bname%20dose%7Bunits%20threshold%20light%7Bmin%7Dcommon%7Bmin%7Dstrong%7Bmin%20max%7D%7D%7D%7D%7D";
        };
    }
    /**
     * @param {?} substanceName
     * @param {function(!DoseDTO): void} cb
     * @return {void}
     */
    SubstanceAPI.prototype._fetchDoseData = /**
     * @param {?} substanceName
     * @param {function(!DoseDTO): void} cb
     * @return {void}
     */
    function (substanceName, cb) {
        // uncomment the following code if you intend to debug and develop
        // requestAnimationFrame(() =>
        //     cb({"data":{"substances":[{"name":"LSD","roas":[{"dose":{"common":{"min":75},"light":{"min":25},"strong":{"min":150,"max":300},"threshold":15,"units":"µg"},"name":"sublingual"}]}]}})
        // );
        // return;
        try {
            /** @type {!XMLHttpRequest} */
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (aEvt) {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        cb(/** @type {!DoseDTO} */ (JSON.parse(xhr.responseText)));
                    }
                    catch (e) {
                        //
                    }
                }
            };
            xhr.open('GET', this._apiDoseQuery(substanceName));
            xhr.send();
        }
        catch (e) {
            //
        }
    };
    return SubstanceAPI;
}());
if (false) {
    /** @type {function(?): string} */
    SubstanceAPI.prototype._apiDoseQuery;
}
var DoseChart = /** @class */ (function () {
    function DoseChart(chartMount, _a) {
        var substanceAPI = _a.substanceAPI;
        this._dpi = window.devicePixelRatio || 1;
        // this._scaleFactor = window.outerHeight / window.innerHeight;
        this._scaleFactor = this._dpi;
        this._targetRect = {
            width: 250,
            height: 81
        };
        this._doseNamePos = [];
        this._substanceAPI = substanceAPI;
        chartMount.style.maxWidth = '250px';
        chartMount.style.backgroundColor = 'white';
        /** @type {!HTMLAnchorElement} */
        var outerLink = document.createElement('a');
        outerLink.style.cursor = 'default';
        /** @type {!HTMLCanvasElement} */
        var canvas = document.createElement('canvas');
        canvas.style.maxWidth = '100%';
        outerLink.appendChild(canvas);
        chartMount.appendChild(outerLink);
        this._substanceName = /** @type {string} */ (chartMount.dataset['substance']);
        this._roa = String(chartMount.dataset['roa']).toLowerCase();
        this._canvas = canvas;
        this._link = outerLink;
        this._resizeCanvasIfNeeded();
        this._initChart();
    }
    /**
     * @return {void}
     */
    DoseChart.prototype._teardown = /**
     * @return {void}
     */
    function () {
        /** @type {!Node} */
        var parent = this._canvas.parentNode;
        if (!parent) {
            return;
        }
        parent.removeChild(this._canvas);
    };
    /**
     * @return {void}
     */
    DoseChart.prototype._initChart = /**
     * @return {void}
     */
    function () {
        var _this = this;
        this._substanceAPI._fetchDoseData(this._substanceName, function (response) {
            /** @type {!Array<!SubstancesItem>} */
            var substanceData = response['data']['substances'];
            if (substanceData.length === 0) {
                _this._teardown();
                return;
            }
            /** @type {!SubstancesItem} */
            var substance = substanceData[0];
            if (substance['name'] !== _this._substanceName
                && substance['roas'].length === 0) {
                _this._teardown();
                return;
            }
            /** @type {!Array<!RoasItem>} */
            var roas = substance['roas'];
            /** @type {!RoasItem} */
            var roa;
            for (var i = 0; i < roas.length; ++i) {
                if (roas[i]
                    && 'name' in roas[i]
                    && _this._roa === roas[i]['name']) {
                    roa = roas[i];
                }
            }
            if (!roa) {
                _this._teardown();
                return;
            }
            _this._renderWithData(roa);
        });
    };
    /**
     * @return {void}
     */
    DoseChart.prototype._resizeCanvasIfNeeded = /**
     * @return {void}
     */
    function () {
        this._canvas.width = this._targetRect.width * this._scaleFactor;
        this._canvas.height = this._targetRect.height * this._scaleFactor;
    };
    /**
     * @param {!RoasItem} roa
     * @return {void}
     */
    DoseChart.prototype._renderDoseLines = /**
     * @param {!RoasItem} roa
     * @return {void}
     */
    function (roa) {
        var _this = this;
        /** @type {!CanvasRenderingContext2D} */
        var ctx = this._canvas.getContext('2d');
        /** @type {number} */
        var outerPaddingRatio = 0.25;
        /** @type {number} */
        var lineMarginRatio = 0.2;
        /** @type {number} */
        var lineLength = this._targetRect.width * (1 - outerPaddingRatio) / 3;
        /** @type {number} */
        var linePartLength = lineLength * (1 - lineMarginRatio);
        /** @type {number} */
        var lineMarginPartLength = lineLength * lineMarginRatio;
        /** @type {number} */
        var lineOffset = this._targetRect.width * outerPaddingRatio / 2;
        /** @type {number} */
        var rowHeight = (this._targetRect.height / 3);
        /** @type {number} */
        var desiredBaseFontSize = 14;
        /** @type {number} */
        var scaledFontSize = desiredBaseFontSize * this._scaleFactor;
        /** @type {string} */
        var targetFont = scaledFontSize + "px Arial";
        /** @type {!Array<!Array<!Array<(!Array<?>|!Array<number>)>>>} */
        var lineSpec = (/** @type {!Array<!Array<?>>} */ ([
            [
                [
                    [
                        0,
                        'threshold',
                        '#81F7F3',
                        roa['dose']['threshold'],
                        '/wiki/Dosage_classification#Threshold'
                    ],
                    [
                        2,
                        'common',
                        '#FFFF00',
                        roa['dose']['common'] && roa['dose']['common']['min'],
                        '/wiki/Dosage_classification#Common'
                    ],
                    [
                        4,
                        'heavy',
                        '#FF0000',
                        // heavy
                        roa['dose']['strong'] && roa['dose']['strong']['max'],
                        '/wiki/Dosage_classification#Heavy'
                    ]
                ],
                function (i) { return [
                    lineOffset + linePartLength * i + lineMarginPartLength * i + lineMarginPartLength * 0.5,
                    lineOffset + linePartLength * (i + 1) + lineMarginPartLength * i + lineMarginPartLength * 0.5,
                ]; }
            ],
            [
                [
                    [
                        1,
                        'light',
                        '#90ee90',
                        roa['dose']['light'] && roa['dose']['light']['min'],
                        '/wiki/Dosage_classification#Light'
                    ],
                    [
                        3,
                        'strong',
                        '#FFFF00',
                        roa['dose']['strong'] && roa['dose']['strong']['min'],
                        '/wiki/Dosage_classification#Strong'
                    ]
                ],
                function (i) { return [
                    lineOffset + linePartLength * (i + 1) * 0.5 + lineMarginPartLength * (i * 4) + lineMarginPartLength * 0.5,
                    lineOffset + linePartLength * (i + 1) + lineMarginPartLength * (i + 1) * 2 + lineMarginPartLength * 0.5,
                ]; }
            ],
        ])).map(function (_a, k) {
            var line = _a[0], fx = _a[1];
            return line.map(function (e, i) {
                return [
                    e,
                    fx(i).map(function (y) { return y * _this._scaleFactor; }).concat([
                        rowHeight * (k + 1) * _this._scaleFactor
                    ])
                ];
            });
        });
        /** @type {!Array<?>} */
        var doseRenderPos = [];
        // ctx.translate(0, -2.5 * this._scaleFactor);
        ctx.save();
        lineSpec.forEach(function (line, k) {
            return line.forEach(function (lineNode) {
                /** @type {(!Array<?>|!Array<number>)} */
                var data = lineNode[0];
                /** @type {(!Array<?>|!Array<number>)} */
                var coords = lineNode[1];
                /** @type {number} */
                var id = /** @type {?} */ (data[0]);
                /** @type {string} */
                var doseName = /** @type {?} */ (data[1]);
                /** @type {string} */
                var doseColor = /** @type {?} */ (data[2]);
                /** @type {number} */
                var dose = /** @type {number} */ (data[3]);
                /** @type {string} */
                var doseNameLink = /** @type {string} */ (data[4]);
                var _a = /** @type {!Array<?>} */ (coords), X_1 = _a[0], X_2 = _a[1], Y_1 = _a[2];
                ctx.fillStyle = doseColor;
                ctx.strokeStyle = doseColor;
                ctx.lineWidth = 5 * _this._scaleFactor * 0.5;
                ctx.beginPath();
                ctx.moveTo(X_1, Y_1);
                ctx.lineTo(X_2, Y_1);
                ctx.stroke();
                if (doseName === 'heavy') {
                    for (var j = 0; j < 4; ++j) {
                        ctx.beginPath();
                        ctx.moveTo(X_2 + (2 + j * 4) * _this._scaleFactor, Y_1);
                        ctx.lineTo(X_2 + (4 + j * 4) * _this._scaleFactor, Y_1);
                        ctx.stroke();
                    }
                }
                ctx.font = targetFont;
                ctx.fillStyle = 'darkblue';
                /** @type {!TextMetrics} */
                var measuredText = ctx.measureText(doseName);
                ctx.fillText(doseName, X_1 + (X_2 - X_1) * 0.5 - measuredText.width * 0.5, Y_1 + scaledFontSize * k * 1.55 - scaledFontSize * 0.5);
                _this._doseNamePos.push([
                    X_1 + (X_2 - X_1) * 0.5 - measuredText.width * 0.5,
                    Y_1 + scaledFontSize * k * 1.55 - scaledFontSize * 0.5,
                    measuredText.width,
                    scaledFontSize,
                    doseNameLink,
                ]);
                ctx.fillStyle = '#000000';
                /** @type {(number|string)} */
                var mappedDose = dose || '?';
                /** @type {!TextMetrics} */
                var doseRefWidth = ctx.measureText('9999');
                /** @type {!TextMetrics} */
                var doseWidth = ctx.measureText(String(mappedDose));
                /** @type {number} */
                var refOffset = (doseRefWidth.width - doseWidth.width) / 2;
                ctx.fillText(String(mappedDose), refOffset + (rowHeight * 1 + linePartLength * 0.7 * id) * _this._scaleFactor, (rowHeight + rowHeight * 0.65) * _this._scaleFactor);
                doseRenderPos.push([
                    String(mappedDose),
                    doseWidth.width,
                    refOffset + (rowHeight * 1 + linePartLength * 0.7 * id) * _this._scaleFactor,
                    (rowHeight + rowHeight * 0.65) * _this._scaleFactor
                ]);
                if (id === 4) {
                    ctx.save();
                    ctx.font = "italic " + targetFont;
                    ctx.fillText(roa['dose']['units'], refOffset + doseWidth.width * 1.35 + (rowHeight * 1.2 + linePartLength * 0.66 * id) * _this._scaleFactor, (rowHeight + rowHeight * 0.65) * _this._scaleFactor);
                    ctx.restore();
                }
            });
        });
        /** @type {!Array<?>} */
        var sortedRP = doseRenderPos.sort(function (a, b) { return a[2] - b[2]; });
        /** @type {!TextMetrics} */
        var minusWidth = ctx.measureText('-');
        for (var i = 0; i < sortedRP.length; ++i) {
            if (i === 0) {
                continue;
            }
            /** @type {?} */
            var dRP = sortedRP[i];
            /** @type {?} */
            var pDRP = sortedRP[i - 1];
            ctx.fillText('-', pDRP[2] + pDRP[1] + (dRP[2] - (pDRP[2] + pDRP[1]) - minusWidth.width) * 0.5, pDRP[3]);
        }
        ctx.restore();
    };
    /**
     * @param {?} isActive
     * @param {string=} link
     * @return {void}
     */
    DoseChart.prototype._toggleCanvasLink = /**
     * @param {?} isActive
     * @param {string=} link
     * @return {void}
     */
    function (isActive, link) {
        if (!isActive) {
            this._link.href = '';
            this._link.style.cursor = 'default';
            return;
        }
        this._link.href = link;
        this._link.style.cursor = 'pointer';
    };
    /**
     * @return {void}
     */
    DoseChart.prototype._attachMouseEvents = /**
     * @return {void}
     */
    function () {
        var _this = this;
        if (this._doseNamePos.length === 0) {
            return;
        }
        this._canvas.addEventListener('mousemove', function (event) {
            /** @type {(!ClientRect|!DOMRect)} */
            var ebcr = (/** @type {!HTMLDivElement} */ (event.target)).getBoundingClientRect();
            /** @type {number} */
            var refX = event.clientX - ebcr.left;
            /** @type {number} */
            var refY = event.clientY - ebcr.top;
            /** @type {number} */
            var mouseX = refX * _this._scaleFactor;
            /** @type {number} */
            var mouseY = refY * _this._scaleFactor;
            _this._doseNamePos.some(function (namePos) {
                var X = namePos[0], Y = namePos[1], w = namePos[2], h = namePos[3], link = namePos[4];
                /** @type {number} */
                var X_1 = X;
                /** @type {number} */
                var X_2 = X + w;
                /** @type {number} */
                var Y_1 = Y + 5 - h;
                /** @type {number} */
                var Y_2 = Y + 5;
                /** @type {boolean} */
                var isMatch = mouseX >= X_1
                    && mouseX <= X_2
                    && mouseY >= Y_1
                    && mouseY <= Y_2;
                if (isMatch) {
                    _this._toggleCanvasLink(true, link);
                    return true;
                }
                _this._toggleCanvasLink(false);
                return false;
            });
        });
        this._canvas.addEventListener('mouseleave', function (event) {
            _this._toggleCanvasLink(false);
        });
    };
    /**
     * @param {!RoasItem} roa
     * @return {void}
     */
    DoseChart.prototype._renderWithData = /**
     * @param {!RoasItem} roa
     * @return {void}
     */
    function (roa) {
        this._renderDoseLines(roa);
        this._attachMouseEvents();
    };
    return DoseChart;
}());
if (false) {
    /** @type {!HTMLCanvasElement} */
    DoseChart.prototype._canvas;
    /** @type {!HTMLAnchorElement} */
    DoseChart.prototype._link;
    /** @type {!SubstanceAPI} */
    DoseChart.prototype._substanceAPI;
    /** @type {string} */
    DoseChart.prototype._roa;
    /** @type {string} */
    DoseChart.prototype._substanceName;
    /** @type {{width: number, height: number}} */
    DoseChart.prototype._targetRect;
    /** @type {!Array<!Array<?>>} */
    DoseChart.prototype._doseNamePos;
    /** @type {number} */
    DoseChart.prototype._dpi;
    /** @type {number} */
    DoseChart.prototype._scaleFactor;
}
(function () {
    /** @type {function(): void} */
    var init = function () {
        /** @type {!SubstanceAPI} */
        var substanceAPI = new SubstanceAPI();
        (/** @type {!Array<!HTMLTableRowElement>} */ (Array.from(document.querySelectorAll('tr.dosechart'))))
            .map(function (node) { return new DoseChart(node, { substanceAPI: substanceAPI }); });
    };
    if (document.readyState === "complete") {
        init();
    }
    else {
        window.addEventListener('DOMContentLoaded', init);
    }
})();
//# sourceMappingURL=ddc.js.map