"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./ListItem.scss");
function ListItem(props) {
    return (<div className="list-item flex" onClick={props.onClick}>
      <div className="item-image-wrapper flex-h-v">
        <img src={props.image} alt=""/>
      </div>
      <div className="item-info flex-1 flex-col-center">
        <h3 className="item-title">{props.title}</h3>
        <h5 className="item-subtitle color-666">{props.subtitle}</h5>
      </div>
    </div>);
}
exports.default = ListItem;
