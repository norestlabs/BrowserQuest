export default class Text {
    text : string;
    /**
     * The border size.
     * 
     * @type {number}
     * @memberof Text
     */
    strokeSize : number | undefined;
    /**
     * The border color.
     * 
     * @type {string}
     * @memberof Text
     */
    strokeColor : string | undefined;
    /**
     * The fill color.
     * 
     * @type {string}
     * @memberof Text
     */
    fillStyle : string | undefined;
    centered : boolean | undefined;
    fontSize : number | undefined;
    alpha : number = 1;

    constructor (t : string, centered? : boolean, strokeSize? : number, strokeColor? : string, fillstyle? : string, fontSize? : number, alpha? : number) {
        this.text = t;
        this.strokeSize = strokeSize;
        this.strokeColor = strokeColor;
        this.fillStyle = fillstyle;
        this.centered = centered;
        this.fontSize = fontSize;
        this.alpha = alpha || 1;
    }
}