import MessageToast from "sap/m/MessageToast";
import Fragment from "sap/ui/core/Fragment";
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import UpdateMethod from "sap/ui/model/odata/UpdateMethod";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import formate from "sap/ui/core/format/DateFormat";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import Filter from "sap/ui/model/Filter";



export default class Display extends Controller {

    public header: JSONModel = new JSONModel();
    public line: JSONModel = new JSONModel();
    public _pDialog: any
    public _oDialog: any
    public point = 0;
    public showType: number
    public gateNum: any;
    public gateNum2: any;
    public o_popup: any;
    public Billingdocno: any;
    public EntryType: any;
    public Bukrs: any;
    public xCsrfToken: string = "";
    public oDataModel: ODataModel;
    public formate: any;
    public gate: any;
    public purchorg: any;

    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("editfield").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(oEvent: any): void {
       
        this.Billingdocno = this.getOwnerComponent()?.getModel("OpenEntry")?.getProperty("/Billingdocno")
        this.Bukrs = this.getOwnerComponent()?.getModel("OpenEntry")?.getProperty("/Bukrs")
      

        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/", {
            defaultCountMode: "None",
            defaultUpdateMethod: UpdateMethod.Merge
        });
        this.oDataModel.setDefaultBindingMode("TwoWay");

        var oDateFormat = formate.getDateInstance({ pattern: "yyyy-MM-dd'T'HH:mm:ss" });
        //(this.byId("_IDGenSmartField82") as any).setValue(oDateFormat.format(new Date()));
            
        this.getView()!.setModel(this.oDataModel);
        // var oToday = new Date();
        // var oModel2 = new JSONModel();
        // oModel2.setData({
        //     Gateindate: oDateFormat.format(new Date())
        // });
        // this.byId("_IDGenSmartField82")?.setModel(oModel2);

        var smartFilterBar =  this.getView()!.byId("smartForm1");  // get the filter bar instance


        var that = this;
        this.oDataModel.getMetaModel().loaded().then(function () {
            let sPath = `/ZIRN(Bukrs='${that.Bukrs}',Billingdocno='${that.Billingdocno}')`;
            that.byId("smartForm1")!.bindElement(sPath);
            that.header.bindContext(sPath)
           
        });
console.log(this.oDataModel)
        // that.byId("TableNewId2")!.setModel(this.line, "DETAILS");

       // let oInput = (this.byId("TableNewId2") as any).getModel("DETAILS");
        if (this.oDataModel) {
            this.oDataModel.setProperty("/isEditable",false);}

    }

 
    public setfieldeditable() {
        let oInput = (this.byId("TableNewId2") as any).getModel("DETAILS");
        console.log(oInput); // Check if the control exists
        if (oInput) {
            oInput.setProperty("/isEditable",false);
        } else {
            console.error("Control not found");
        }
    }
  

    public onsave() {
       
        let mChangedEntities = (this.oDataModel as any).mChangedEntities;
        let sPath = Object.keys(mChangedEntities)[0];
       
        let that = this;
       

        this.oDataModel.update("/" + sPath, mChangedEntities[sPath], {
            success: function (response: any) {
                
                
                let gateno = (that.oDataModel as any).oData[sPath].Gateno;
               
                console.log("Update Successful");
                            BusyIndicator.hide()
                            const router = (that.getOwnerComponent() as any).getRouter();
                            router.navTo("Grid")
        
            },
            error: function (error: any) {
                

            }
        })



    }
  
    
    public getDataa(ajaxurl: string, header: any) {
        debugger;
        return $.ajax({
            url: ajaxurl,
            method: "GET",
            contentType: "application/json",
            headers: header,
            success: function (data) {
                return data

            },
            error: function (error: any) {
                return error.responseJSON
            }
        })
    }

}

