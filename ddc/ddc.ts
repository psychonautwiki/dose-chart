interface DoseDTO {
    data: Data;
}
interface Data {
    substances: SubstancesItem[];
}
interface SubstancesItem {
    name: string;
    roas: RoasItem[];
}
interface RoasItem {
    dose: Dose;
    name: string;
}
interface Dose {
    common: Common;
    light: Light;
    strong: Strong;
    threshold: number;
    units: string;
}
interface Common {
    min: number;
}
interface Light {
    min: number;
}
interface Strong {
    min: number;
    max: number;
}

class SubstanceAPI {
    private _apiDoseQuery: (string) => string;

    constructor() {
        this._apiDoseQuery = substanceName =>
            `https://api.psychonautwiki.org/?query=%7Bsubstances(query%3A%22${substanceName}%22)%7Bname%20roas%7Bname%20dose%7Bunits%20threshold%20light%7Bmin%7Dcommon%7Bmin%7Dstrong%7Bmin%20max%7D%7D%7D%7D%7D`;
    }

    _fetchDoseData(substanceName, cb: (response: DoseDTO) => void ) {
        // uncomment the following code if you intend to debug and develop

        // requestAnimationFrame(() =>
        //     cb({"data":{"substances":[{"name":"LSD","roas":[{"dose":{"common":{"min":75},"light":{"min":25},"strong":{"min":150,"max":300},"threshold":15,"units":"µg"},"name":"sublingual"}]}]}})
        // );

        // return;

        try {
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = aEvt => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        cb(JSON.parse(xhr.responseText) as DoseDTO);
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
    }
}

class DoseChart {
    private _canvas: HTMLCanvasElement;
    private _link: HTMLAnchorElement;
    private _substanceAPI: SubstanceAPI;
    private _roa: string;
    private _substanceName: string;
    private _targetRect: { width: number, height: number };
    private _doseNamePos: [number, number, number, number, string][];

    private _dpi: number;
    private _scaleFactor: number;
    
    constructor(chartMount: HTMLTableRowElement, { substanceAPI }: { substanceAPI: SubstanceAPI }) {
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
        
        const outerLink = document.createElement('a');

        outerLink.style.cursor = 'default';

        const canvas = document.createElement('canvas');

        canvas.style.maxWidth = '100%';
        
        outerLink.appendChild(canvas);
        chartMount.appendChild(outerLink);

        this._substanceName = chartMount.dataset['substance'] as string;
        this._roa = String(chartMount.dataset['roa']).toLowerCase();

        this._canvas = canvas;
        this._link = outerLink;

        this._resizeCanvasIfNeeded();

        this._initChart();
    }

    _teardown() {
        const parent = this._canvas.parentNode;
        
        if (!parent) {
            return;
        }

        parent.removeChild(this._canvas);
    }

    _initChart() {
        this._substanceAPI._fetchDoseData(
            this._substanceName,
            (response: DoseDTO) => {
                const substanceData = response['data']['substances'];

                if (substanceData.length === 0) {
                    this._teardown();
                    return;
                }

                const substance = substanceData[0];

                if (
                    substance['name'] !== this._substanceName
                    && substance['roas'].length === 0
                ) {
                    this._teardown();
                    return;
                }

                const roas = substance['roas'];

                let roa: RoasItem;

                for (let i = 0; i < roas.length; ++i) {
                    if (   roas[i]
                        && 'name' in roas[i]
                        && this._roa === roas[i]['name']
                    ) {
                        roa = roas[i];
                    }
                }

                if (!roa) {
                    this._teardown();
                    return;
                }

                this._renderWithData(roa);
            }
        );
    }

    _resizeCanvasIfNeeded() {
        this._canvas.width = this._targetRect.width * this._scaleFactor;
        this._canvas.height = this._targetRect.height * this._scaleFactor;
    }

    _renderDoseLines(roa: RoasItem) {
        const ctx = this._canvas.getContext('2d');
        /*
            #81F7F3 T L
            #FFFF00 L C
            #FF0000 C S
            #FF0000   H (dots)

            #90ee90 L C
            #ffa500 H S
        */

        const outerPaddingRatio = 0.25;
        const lineMarginRatio = 0.2;

        const lineLength = this._targetRect.width * (1 - outerPaddingRatio) / 3;

        const linePartLength = lineLength * (1 - lineMarginRatio);
        const lineMarginPartLength = lineLength * lineMarginRatio;

        const lineOffset = this._targetRect.width * outerPaddingRatio / 2;

        const rowHeight = (this._targetRect.height / 3);

        const desiredBaseFontSize = 14;
        const scaledFontSize = desiredBaseFontSize * this._scaleFactor;

        const targetFont = `${scaledFontSize}px Arial`;

        const lineSpec = ([
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
                (i: number) => [
                    lineOffset + linePartLength * i       + lineMarginPartLength * i + lineMarginPartLength * 0.5,
                    lineOffset + linePartLength * (i + 1) + lineMarginPartLength * i + lineMarginPartLength * 0.5,
                ]
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
                (i: number) => [
                    lineOffset + linePartLength * (i + 1) * 0.5 + lineMarginPartLength * (i * 4)     + lineMarginPartLength * 0.5,
                    lineOffset + linePartLength * (i + 1)       + lineMarginPartLength * (i + 1) * 2 + lineMarginPartLength * 0.5,
                ]
            ],
        ] as [[number, string, string, number, string][], (i: number) => number[]][]).map(([line, fx ], k) =>
            line.map((e, i) =>
                [
                    e,
                    [
                        ...fx(i).map(y => y * this._scaleFactor),
                        rowHeight * (k + 1) * this._scaleFactor
                    ]
                ]
            )
        );

        const doseRenderPos = [];

        // ctx.translate(0, -2.5 * this._scaleFactor);

        ctx.save();

        lineSpec.forEach((line, k) =>
            line.forEach(lineNode => {
                const data = lineNode[0];
                const coords = lineNode[1];

                const id: number = data[0] as any;
                const doseName: string = data[1] as any;
                const doseColor: string = data[2] as any;
                const dose = data[3] as number;
                const doseNameLink = data[4] as string;

                const [X_1, X_2, Y_1]: number[] = coords as any[];

                ctx.fillStyle   = doseColor;
                ctx.strokeStyle = doseColor;
                ctx.lineWidth   = 5 * this._scaleFactor * 0.5;

                ctx.beginPath();

                ctx.moveTo( X_1, Y_1 );
                ctx.lineTo( X_2, Y_1 );

                ctx.stroke();

                if (doseName === 'heavy') {
                    for (let j = 0; j < 4; ++j) {
                        ctx.beginPath();

                        ctx.moveTo( X_2 + (2 + j * 4) * this._scaleFactor, Y_1 );
                        ctx.lineTo( X_2 + (4 + j * 4) * this._scaleFactor, Y_1 );

                        ctx.stroke();
                    }
                }

                ctx.font = targetFont;
                ctx.fillStyle   = 'darkblue';

                const measuredText = ctx.measureText( doseName );

                ctx.fillText(
                    doseName,
                    X_1 + (X_2 - X_1) * 0.5 - measuredText.width * 0.5,
                    Y_1 + scaledFontSize * k * 1.55 - scaledFontSize * 0.5
                );

                this._doseNamePos.push([
                    X_1 + (X_2 - X_1) * 0.5 - measuredText.width * 0.5,
                    Y_1 + scaledFontSize * k * 1.55 - scaledFontSize * 0.5,
                    measuredText.width,
                    scaledFontSize,
                    doseNameLink,
                ])

                ctx.fillStyle   = '#000000';

                const mappedDose = dose || '?';

                const doseRefWidth = ctx.measureText( '9999' );
                const doseWidth = ctx.measureText( String(mappedDose) );

                const refOffset = (doseRefWidth.width - doseWidth.width) / 2;

                ctx.fillText(
                    String(mappedDose),
                    refOffset + (rowHeight * 1 + linePartLength * 0.7 * id) * this._scaleFactor,
                    (rowHeight + rowHeight * 0.65) * this._scaleFactor
                );

                doseRenderPos.push([
                    String(mappedDose),
                    doseWidth.width,
                    refOffset + (rowHeight * 1 + linePartLength * 0.7 * id) * this._scaleFactor,
                    (rowHeight + rowHeight * 0.65) * this._scaleFactor
                ]);

                if (id === 4) {
                    ctx.save();

                    ctx.font = `italic ${targetFont}`;

                    ctx.fillText(
                        roa['dose']['units'],
                        refOffset + doseWidth.width * 1.35 + (rowHeight * 1.2 + linePartLength * 0.66 * id) * this._scaleFactor,
                        (rowHeight + rowHeight * 0.65) * this._scaleFactor
                    );

                    ctx.restore();
                }
            })
        );

        const sortedRP = doseRenderPos.sort((a, b) => a[2] - b[2]);

        const minusWidth = ctx.measureText( '-' );

        for (let i = 0; i < sortedRP.length; ++i) {
            if (i === 0) {
                continue;
            }

            const dRP = sortedRP[i];
            const pDRP = sortedRP[i - 1];

            ctx.fillText(
                '-',
                pDRP[2] + pDRP[1] + (dRP[2] - (pDRP[2] + pDRP[1]) - minusWidth.width) * 0.5,
                pDRP[3]
            );
        }

        ctx.restore();
    }

    _toggleCanvasLink(isActive, link?: string) {
        if (!isActive) {
            this._link.href = '';
            this._link.style.cursor = 'default';

            return;
        }

        this._link.href = link;
        this._link.style.cursor = 'pointer';
    }

    _attachMouseEvents() {
        if (this._doseNamePos.length === 0) {
            return;
        }

        this._canvas.addEventListener('mousemove', event => {
            const ebcr = ( event.target as HTMLDivElement ).getBoundingClientRect();
            const refX = event.clientX - ebcr.left;
            const refY = event.clientY - ebcr.top;

            const mouseX = refX * this._scaleFactor;
            const mouseY = refY * this._scaleFactor;

            this._doseNamePos.some(namePos => {
                const [X, Y, w, h, link] = namePos;
    
                const X_1 = X;
                const X_2 = X + w;
    
                const Y_1 = Y + 5 - h;
                const Y_2 = Y + 5;
    
                const isMatch = mouseX >= X_1
                             && mouseX <= X_2
                             && mouseY >= Y_1
                             && mouseY <= Y_2;

                if (isMatch) {
                    this._toggleCanvasLink(true, link);

                    return true;
                }

                this._toggleCanvasLink(false);

                return false;
            });
        });

        this._canvas.addEventListener('mouseleave', event => {
            this._toggleCanvasLink(false);
        });
    }

    _renderWithData(roa: RoasItem) {
        this._renderDoseLines(roa);
        this._attachMouseEvents();
    }
}

(() => {
    const init = () => {
        const substanceAPI = new SubstanceAPI();

        (
            Array.from(document.querySelectorAll('tr.dosechart')) as HTMLTableRowElement[]
        )
        .map(node => new DoseChart(node, { substanceAPI }));
    };

    if (document.readyState === "complete") {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }
})();
