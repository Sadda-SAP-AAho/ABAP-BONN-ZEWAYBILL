import Controller from "sap/ui/core/mvc/Controller";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import UI5Element from "sap/ui/core/Element";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import UpdateMethod from "sap/ui/model/odata/UpdateMethod";
import Fragment from "sap/ui/core/Fragment";
/**
 * @namespace zirn.controller
 */
export default class Display extends Controller {
    public onInit(): void {
        
        let storedData = JSON.parse(localStorage.getItem("selectedEntryList") || "{}");
        const dataModel = new JSONModel(storedData);
        this.getView()?.setModel(dataModel, "myModel");
        console.log(this.getView());
    }
    
}