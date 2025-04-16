import Controller from "sap/ui/core/mvc/Controller";
import Dialog from "sap/m/Dialog";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BusyDialog from "sap/m/BusyDialog";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";
import MessageToast from "sap/m/MessageToast";
import PDFViewer from "sap/m/PDFViewer";
import Control from "sap/ui/core/Control";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import Input from "sap/m/Input";
import Fragment from "sap/ui/core/Fragment";
import Table from "sap/ui/table/Table";
import Device from "sap/ui/Device";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import MessageBox from "sap/m/MessageBox";
import Token from "sap/m/Token";
import Column from "sap/ui/table/Column";
import Text from "sap/m/Text";

let flag = 1;
/**
 * @namespace zirn.controller
*/
export default class Grid extends Controller {
    private oModel: ODataModel;
    public _pDialog: any
    public _oDialog: any
    public Billingdocno: any
    public Bukrs: any
    public _pValueHelpDialog: Promise<Control | Control[]> | null = null;
    public header: JSONModel = new JSONModel();
    public point = 0;
    public vnum: any;
    public tanme: any;
    public tGSt: any;
    public grno: any;
    public selectval: any;
    public tname: any;
    public gdate: any;
    private _PDFViewer: PDFViewer;
    // private _oValueHelpDialog: ValueHelpDialog | null = null;
    public selectedOrder: string = "";
    public _oValueHelpDialog: any;
    public plantValueHelp: any;

    public contno: any
    public linesno: any
    public custsno: any
    public EBill: any
    public NWeight: any
    public GWeight: any
    public PInvoiceno: any
    public dcountry: any
    public booknum: any
    public maxcargowt: any
    public ctarewt: any
    public maxgrosswt: any

    public checkEwayFilled: any;
    public dateRegex:any = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    public pCarrier: any

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("Grid").attachPatternMatched(this.getDetails, this);

    }
    public getDetails() {
        const oViewModel = new JSONModel({
            textdata: "" // Default: Not editable
        });
        this.getView()?.setModel(oViewModel, "viewModel");
        this.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");

        this.oModel.refresh(true);
        const oModel1 = this.getView()?.getModel() as ODataModel;
        if (oModel1) {
            oModel1.refresh(true);
        }
        const oSmartTable = (this.byId("_IDGenSmartTable")! as any);
        if (oSmartTable) {
            oSmartTable.rebindTable();
        }
        this.DisableButton("_IDEdittable1");
        this.DisableButton("_IDEdittable2");

    }
    private getDialog(): Dialog {
        return this.byId("_IDGenDialog1") as Dialog;
    }

    private getDialog2(): Dialog {
        return this.byId("_IDGenDialog") as Dialog;
    }

    public onClickGenerateData(): void {
        this.getDialog().open();
    }

    public onValueHelpRequest(): void {
        const oView = this;
        if (!this.plantValueHelp) {
            this.plantValueHelp = new ValueHelpDialog({
                title: "Plant",
                supportMultiselect: false, // Single selection
                key: "Plant",
                // descriptionKey: "PlantName",
                ok: (oEvent) => {
                    const aTokens = oEvent.getParameter("tokens") as Token[];
                    // (this.byId("_IDGenSmartTable")! as any)
                    if (aTokens.length > 0) {
                        (oView.byId("idPlantInput")! as Input).setValue(aTokens[0].getText());
                    }
                    this.plantValueHelp?.close();
                },
                cancel: () => {
                    this.plantValueHelp?.close();
                }
            });
            const oTable = this.plantValueHelp.getTable() as Table;

            // Create an OData Model (Replace with your OData service URL)
            const oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL");
            oTable.setModel(oModel);

            // Bind table to OData entity set (Replace with your actual entity set)
            oTable.bindRows({
                path: "/ZVHPLANT"
            });

            // Add columns dynamically
            oTable.addColumn(new Column({
                label: new Text({ text: "Plant" }),
                template: new Text({ text: "{Plant}" })
            }));
            oTable.addColumn(new Column({
                label: new Text({ text: "Plant Name" }),
                template: new Text({ text: "{PlantName}" })
            }));
        }

        // Open the Value Help Dialog
        this.plantValueHelp.open();
    }

    public onClickEWBUpdateOpen() {
        let newModel = new JSONModel();
        let dialog = this.byId("_IDGenDialog3") as Dialog;
        dialog.setModel(newModel, "EWB");
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        if (selectedIndex.length <= 0){
            MessageToast.show("No Item Selected");
            return;
        }
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        if(fields.EwayBillNo){
            MessageToast.show("Eway Bill already Updated");
            return;
        }
        this.Billingdocno = fields.Billingdocno;
        this.Bukrs = fields.Bukrs;
        dialog.open();
    }
    public onCloseDialog2(): void {
        this.getDialog2().close();
    }

    public onCloseDialog(): void {
        this.getDialog().close();
    }

    public oncloseEWBDialog() {
        let dialog = this.byId("_IDGenDialog3") as Dialog;
        dialog.close();
    }

    public onOKEWBDialog() {
        let sPath = `/ZIRN(Bukrs='${this.Bukrs}',Billingdocno='${this.Billingdocno}')`;
        let that = this;
        let dialog = this.byId("_IDGenDialog3") as Dialog;
        let payload = dialog.getModel("EWB")?.getProperty("/");

      
        if (!this.dateRegex.test(payload.Ewaydate)) {
            MessageBox.error("Date Format is Incorrect for Eway Date");
            return;
        }
        if (!this.dateRegex.test(payload.EwayValidDate)) {
            MessageBox.error("Date Format is Incorrect for Eway Valid Date");
            return;
        }


        this.oModel.update(sPath, {
            ...payload,
            Ewaystatus: "GEN"
        }, {
            headers: {
                "If-Match": "*" // Use "*" if etag is not found (not recommended in strict cases)
            },
            success: function (response: any) {
                console.log("Update Successful");
                BusyIndicator.hide();

                // Refresh the Grid instead of navigating
                let oTable = that.byId("_IDGenSmartTable"); // Get the SmartTable control
                if (oTable) {
                    oTable.getModel()?.refresh(true); // Refresh the model to fetch updated data
                } else {
                    console.warn("SmartTable not found. Unable to refresh.");
                }
                dialog.close();
            },
            error: function (error: any) {
                console.error("Update Failed", error);
            }
        });

    }

    public oncloseIRNDialog() {
        let dialog = this.byId("_IDGenDialog4") as Dialog;
        dialog.close();
    }

    public onClickIRNUpdateOpen() {
        let newModel = new JSONModel();
        let dialog = this.byId("_IDGenDialog4") as Dialog;
        dialog.setModel(newModel, "IRN");
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        if (selectedIndex.length <= 0){
            MessageToast.show("No Item Selected");
            return;
        }
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        if(fields.EwayBillNo){
            MessageToast.show("IRN already Updated");
            return;
        }
        this.Billingdocno = fields.Billingdocno;
        this.Bukrs = fields.Bukrs;
        dialog.open();
    }

    public onOKIRNDialog() {
        let sPath = `/ZIRN(Bukrs='${this.Bukrs}',Billingdocno='${this.Billingdocno}')`;
        let that = this;
        let dialog = this.byId("_IDGenDialog4") as Dialog;
        let payload = dialog.getModel("IRN")?.getProperty("/");

        if (!this.dateRegex.test(payload.Ackdate)) {
            MessageBox.error("Date Format is Incorrect");
            return;
        }

        this.oModel.update(sPath, {
            ...payload,
            Irnstatus: "GEN"
        }, {
            headers: {
                "If-Match": "*" // Use "*" if etag is not found (not recommended in strict cases)
            },
            success: function (response: any) {
                console.log("Update Successful");
                BusyIndicator.hide();

                // Refresh the Grid instead of navigating
                let oTable = that.byId("_IDGenSmartTable"); // Get the SmartTable control
                if (oTable) {
                    oTable.getModel()?.refresh(true); // Refresh the model to fetch updated data
                } else {
                    console.warn("SmartTable not found. Unable to refresh.");
                }
                dialog.close();
            },
            error: function (error: any) {
                console.error("Update Failed", error);
            }
        });

    }

    public onGenerateIRNData(): void {
        var oView = this.getView();
        var oPlantInput = (this.byId("idPlantInput")! as any).getValue();
        var oPlantDate = (this.byId("idPlantDate")! as any).getValue();

        //console.log(oPlantInput);
        //console.log(oPlantDate);
        var payload = {
            plant: oPlantInput,       // Value from the Input field
            docdate: oPlantDate  // Value from the DatePicker
        };
        var that = this;
        var formData = new FormData();
        formData.append("plant", oPlantInput);
        formData.append("docdate", oPlantDate);
        BusyIndicator.show(0);
        $.ajax({
            // url: "/sap/bc/http/sap/ZHTTP_GENERATEIRN",
            url: "/sap/bc/http/sap/ZCL_HTTP_GENERATEIRN_NEW",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                console.log(result);
                // if (result.includes("companycode")) {
                //     MessageToast.show(result);
                //     BusyIndicator.hide();
                //     return;
                // }
                // if (result.includes("document")) {
                //     MessageToast.show(result);
                //     BusyIndicator.hide();
                //     return;
                // }
            }
        });
        setTimeout(() => {
            (this.byId("idPlantInput")! as any).setValue(""); // Clear text input
            (this.byId("idPlantDate")! as any).setValue("");
            // this.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
            this.oModel.refresh(true);

            const oModel1 = this.getView()?.getModel() as ODataModel;
            if (oModel1) {
                oModel1.refresh(true);
            }

            const oSmartTable = (this.byId("_IDGenSmartTable")! as any);
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }
            BusyIndicator.hide();
            this.getDialog().close();
        }, 2000);
    }

    public onClickIRN(): void {
        var message = '';
        var errormessage = '';
        let that = this;
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        var formData = new FormData();
        formData.append("companycode", Bukrs);
        formData.append("document", Billingdocno);
        BusyIndicator.show(0);
        $.ajax({
            url: "/sap/bc/http/sap/ZCL_HTTP_IRNNEW",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                BusyIndicator.hide();
                const oViewModel = that.getView()?.getModel("viewModel") as JSONModel;
                if (oViewModel) {
                    if (result != '') {
                        oViewModel.setProperty("/textdata", result);
                    }
                    if (errormessage != '') {
                        oViewModel.setProperty("/textdata", 'Getting Error while Generating Irn No');
                    }
                } else {
                    console.error("viewModel is not defined");
                }
                that.getDialog2().open();
                that.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
                that.oModel.refresh(true);

                const oModel1 = that.getView()?.getModel() as ODataModel;
                if (oModel1) {
                    oModel1.refresh(true);
                }

                const oSmartTable = (that.byId("_IDGenSmartTable")! as any);
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            },
            error: function (result) {
                console.log(result);
                BusyIndicator.hide();
                errormessage = 'error';

            }
        });

    }

    public onClickDelete(): void {
        let that = this;
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();

        if(fields.Ewaybillno || fields.Irnno){
            MessageBox.error("Cannot Delete Document");
            return;
        }

        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        let sPath = `/ZIRN(Bukrs='${Bukrs}',Billingdocno='${Billingdocno}')`;
        this.oModel.remove(sPath,{
            headers:{
                "If-Match":"*"
            },
            success:function(){
                const oSmartTable = (that.byId("_IDGenSmartTable")! as any);
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            }
        });
    }

    public onClickEwayBill(): void {
        let that = this;
        var errormessage = '';
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        var formData = new FormData();
        formData.append("companycode", Bukrs);
        formData.append("document", Billingdocno);
        $.ajax({
            url: `/sap/bc/http/sap/ZCL_HTTP_EWA_GEN`,
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                BusyIndicator.hide();
                const oViewModel = that.getView()?.getModel("viewModel") as JSONModel;
                if (oViewModel) {
                    if (result != '') {
                        oViewModel.setProperty("/textdata", result);
                    }
                    if (errormessage != '') {
                        oViewModel.setProperty("/textdata", 'Getting Error while Generating Irn No');
                    }
                } else {
                    console.error("viewModel is not defined");
                }
                that.getDialog2().open();
                that.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
                that.oModel.refresh(true);

                const oModel1 = that.getView()?.getModel() as ODataModel;
                if (oModel1) {
                    oModel1.refresh(true);
                }

                const oSmartTable = (that.byId("_IDGenSmartTable")! as any);
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            },
            error: function (result) {
                console.log(result);
                BusyIndicator.hide();
                errormessage = 'error';

            }
        })
    }

    public onClickCancelIrn(): void {
        let that = this;
        var errormessage = '';
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        var formData = new FormData();
        formData.append("companycode", Bukrs);
        formData.append("document", Billingdocno);
        $.ajax({
            url: `/sap/bc/http/sap/ZCL_HTTP_CANCELIRN`,
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                BusyIndicator.hide();
                const oViewModel = that.getView()?.getModel("viewModel") as JSONModel;
                if (oViewModel) {
                    if (result != '') {
                        oViewModel.setProperty("/textdata", result);
                    }
                    if (errormessage != '') {
                        oViewModel.setProperty("/textdata", 'Getting Error while Generating Irn No');
                    }
                } else {
                    console.error("viewModel is not defined");
                }
                that.getDialog2().open();
                that.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
                that.oModel.refresh(true);

                const oModel1 = that.getView()?.getModel() as ODataModel;
                if (oModel1) {
                    oModel1.refresh(true);
                }

                const oSmartTable = (that.byId("_IDGenSmartTable")! as any);
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            },
            error: function (result) {
                console.log(result);
                BusyIndicator.hide();
                errormessage = 'error';

            }
        })
    }

    public onClickCancelEWB(): void {
        let that = this;
        var errormessage = '';
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        var formData = new FormData();
        formData.append("companycode", Bukrs);
        formData.append("document", Billingdocno);
        $.ajax({
            url: `/sap/bc/http/sap/ZCL_HTTP_CANCELEWB`,
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                BusyIndicator.hide();
                const oViewModel = that.getView()?.getModel("viewModel") as JSONModel;
                if (oViewModel) {
                    if (result != '') {
                        oViewModel.setProperty("/textdata", result);
                    }
                    if (errormessage != '') {
                        oViewModel.setProperty("/textdata", 'Getting Error while Generating Irn No');
                    }
                } else {
                    console.error("viewModel is not defined");
                }
                that.getDialog2().open();
                that.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
                that.oModel.refresh(true);

                const oModel1 = that.getView()?.getModel() as ODataModel;
                if (oModel1) {
                    oModel1.refresh(true);
                }

                const oSmartTable = (that.byId("_IDGenSmartTable")! as any);
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            },
            error: function (result) {
                console.log(result);
                BusyIndicator.hide();
                errormessage = 'error';

            }
        })
    }


    public onClickEwayBillIrn(): void {
        let that = this;
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        var formData = new FormData();
        formData.append("companycode", Bukrs);
        formData.append("document", Billingdocno);
        $.ajax({
            type: "POST",
            url: `/sap/bc/http/sap/ZCL_HTTP_EWABILLBYIRN    `,
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                BusyIndicator.hide();
                const oViewModel = that.getView()?.getModel("viewModel") as JSONModel;
                if (oViewModel) {
                    if (result != '') {
                        oViewModel.setProperty("/textdata", result);
                    }
                } else {
                    console.error("viewModel is not defined");
                }
                that.getDialog2().open();
                that.oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
                that.oModel.refresh(true);

                const oModel1 = that.getView()?.getModel() as ODataModel;
                if (oModel1) {
                    oModel1.refresh(true);
                }

                const oSmartTable = (that.byId("_IDGenSmartTable")! as any);
                if (oSmartTable) {
                    oSmartTable.rebindTable();
                }
            },
            error: function (result) {
                console.log(result);
                BusyIndicator.hide();

            }
        })
    }
    public onClickPrintForm27(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'DCOriginal' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'DCOriginal';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result === 'JDC' || result === 'JVR' || result === 'JSN') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an invoice type JDC ,JVR ,JSN for Delivery Challan Invoice', { duration: 2000 });
                }
            }
        });
    }
    public onClickPrintForm28(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'DCDuplicate' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'DCDuplicate';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result === 'JDC' || result === 'JVR' || result === 'JSN') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an invoice type JDC ,JVR ,JSN for Delivery Challan Invoice', { duration: 2000 });
                }
            }
        });
    }

    public onClickPrintForm29(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'DCOffice' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'DCOffice';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result === 'JDC' || result === 'JVR' || result === 'JSN') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an invoice type JDC ,JVR ,JSN for Delivery Challan Invoice', { duration: 2000 });
                }
            }
        });
    }


    public onClickPrintForm21(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'stoOriginal' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'stoOriginal';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                if (result !== '' && result !== 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("invoice is not released yet")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Correct Tax Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm22(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'stoDuplicate' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'stoDuplicate';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                if (result !== '' && result !== 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("invoice is not released yet")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Correct Tax Invoice', { duration: 2000 });
                }
            }
        });

    }
    public onClickPrintForm23(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'stoOffice' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'stoOffice';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                if (result !== '' && result !== 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("invoice is not released yet")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Correct Tax Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm24(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'expoOriginal' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'expoOriginal';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("invoice is not released yet")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Distribution chanel EX For Export Tax Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm25(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'expoTransporter' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'expoTransporter';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("invoice is not released yet")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Distribution chanel EX For Export Tax Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm26(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'expoOffice' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'expoOffice';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            if (result.includes("invoice is not released yet")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Distribution chanel EX For Export Tax Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm6(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'pi' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'pi';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {

                if (result !== 'GT') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Distribution chanel EX For Export Tax Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm4(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        var payload = {
            companycode: Bukrs,
            document: Billingdocno
        };
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'PL' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'PL';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                console.log(result);
                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Packing List Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm19(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        var payload = {
            companycode: Bukrs,
            document: Billingdocno
        };
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'CusPL' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'CusPL';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                console.log(result);
                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Custom PKT', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm5(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;

        //console.log(Bukrs);
        //console.log(Billingdocno);
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        //console.log(Bukrs, Billingdocno);
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'COMINV' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'COMINV';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                console.log(result);
                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Commercial Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onClickPrintForm18(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable()
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Bukrs = fields.Bukrs;
        let Billingdocno = fields.Billingdocno;
        var payload = {
            companycode: Bukrs,       // Value from the Input field
            document: Billingdocno  // Value from the DatePicker
        };
        var that = this;
        var formData = new FormData();
        formData.append("document", Billingdocno);
        formData.append("companycode", Bukrs);
        // var url1 = "/sap/bc/http/sap/ZHTTP_ZEWAYBILL_PRINTFORM/";
        var url1 = "/sap/bc/http/sap/ZHTTP_PRINTFORM_NEW?";
        var url2 = "&print=";
        var url3 = "&doc=";
        var url4 = "&cc=";
        var geturlresult = url1 + url2 + 'CUSINV' + url3 + Billingdocno + url4 + Bukrs;
        var urlresult = url1 + url2 + 'CUSINV';
        $.ajax({
            url: geturlresult,
            method: "GET",
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                console.log(result);
                if (result == 'EX') {
                    BusyIndicator.show(0);
                    $.ajax({
                        url: urlresult,
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result) {
                            if (result.includes("companycode")) {

                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
                            //console.log(result)
                            if (result.includes("document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            if (result.includes("Document")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }

                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);

                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            } else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            BusyIndicator.hide();
                            that._PDFViewer.open();
                        },
                        error: function (error) {
                            BusyIndicator.hide();
                        }
                    });
                }
                else {
                    MessageToast.show('Kindly Select an Custom Invoice', { duration: 2000 });
                }
            }
        });

    }

    public onEditData() {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Billingdocno = fields.Billingdocno;
        let Bukrs = fields.Bukrs;

        let newModel = new JSONModel();
        this.getOwnerComponent()?.setModel(newModel, "OpenEntry");
        newModel.setProperty("/Billingdocno", Billingdocno)
        newModel.setProperty("/Bukrs", Bukrs)

        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("editfield")

    }

    public onEditToggle(): void {
        // const oViewModel = this.getView()?.getModel("viewModel") as JSONModel;
        // if (oViewModel) {
        //     oViewModel.setProperty("/isEditable", true);
        // } else {
        //     console.error("viewModel is not defined");
        // }
        let that = this;
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        //console.log(selectedIndex);
    }
    public onSaveChanges(): void {
        const oViewModel = this.getView()?.getModel("viewModel") as JSONModel;
        if (oViewModel) {
            oViewModel.setProperty("/isEditable", false);
        } else {
            console.error("viewModel is not defined");
        }
    }


    public openDialog1(oEvent: any): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        let Billingdocno = fields.Billingdocno;
        let Bukrs = fields.Bukrs;
        let oView = this.getView();
        let that = this;

        if (!oView) {
            console.error("View is undefined! Ensure this function is called within the correct UI5 controller context.");
            return;
        }

        let sPath = `/ZIRN(Bukrs='${Bukrs}',Billingdocno='${Billingdocno}')`;

        if (!this._pDialog) {
            // Load the Fragment Dialog
            Fragment.load({
                id: oView.getId(),
                name: "zirn.view.ValueHelpDialog.updateField",
                controller: this
            }).then((oDialog: any) => {
                oView.addDependent(oDialog);

                // Bind SmartForm to the selected entity
                that.oModel.getMetaModel().loaded().then(function () {
                    let smartForm = that.byId("smartForm11");
                    if (smartForm) {
                        smartForm.bindElement(sPath);
                    }
                });

                this._pDialog = oDialog;
                oDialog.open();
            });
        } else {
            let smartForm = this.byId("smartForm11");
            if (smartForm) {
                smartForm.bindElement(sPath);
            }

            if (this._pDialog.isOpen && this._pDialog.isOpen()) {
                this._pDialog.close();
            }
            this._pDialog.open();
        }
    }
    public vehInputChange(OEvt: any) {
        this.vnum = OEvt.getSource().getValue();
    }
    public TransporterNameChange(OEvt: any) {
        this.tanme = OEvt.getSource().getValue();
    }
    public TransporterGSTNChange(OEvt: any) {
        this.tGSt = OEvt.getSource().getValue();
    }
    public GRInputChange(OEvt: any) {
        this.grno = OEvt.getSource().getValue();
    }
    public GrdInputChange(OEvt: any) {
        this.gdate = OEvt.getSource().getValue();
    }

    public containerno(OEvt: any) {
        this.contno = OEvt.getSource().getValue();
    }
    public linesealno(OEvt: any) {
        this.linesno = OEvt.getSource().getValue();
    }
    public customsealno(OEvt: any) {
        this.custsno = OEvt.getSource().getValue();
    }
    public bookno(OEvt: any) {
        this.booknum = OEvt.getSource().getValue();
    }
    public Placecarrier(OEvt: any) {
        this.pCarrier = OEvt.getSource().getValue();
    }
    public GrossWeight(OEvt: any) {
        this.GWeight = OEvt.getSource().getValue();
    }

    public maxgWt(OEvt: any) {
        this.maxgrosswt = OEvt.getSource().getValue();
    }
    public ctarewt2(OEvt: any) {
        this.ctarewt = OEvt.getSource().getValue();
    }
    public maxcargowt2(OEvt: any) {
        this.maxcargowt = OEvt.getSource().getValue();
    }
    public ProformaInvoiceno(OEvt: any) {
        this.PInvoiceno = OEvt.getSource().getValue();
    }
    public destinationcountry(OEvt: any) {
        this.dcountry = OEvt.getSource().getValue();
    }
    public EnableButton(_id = "") {
        (this.byId(_id) as any).setEnabled(true)
    }
    public DisableButton(_id = "") {
        (this.byId(_id) as any).setEnabled(false)

    }

    public onSelectionChange(oEvent: any) {
        this.EnableButton("_IDEdittable1");
        this.EnableButton("_IDEdittable2");

        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        this.Billingdocno = fields.Billingdocno;
        this.Bukrs = fields.Bukrs;
    }



    public dialogOk() {

        let sPath = `/ZIRN(Bukrs='${this.Bukrs}',Billingdocno='${this.Billingdocno}')`;
        let payload
        if (this.selectval) {
            this.tanme = this.selectval.split("(")[0]
        }

        if (this.vnum || this.selectval || this.tGSt || this.tanme || this.grno || this.gdate) {
            payload = {
                Vehiclenum: this.vnum,
                Transportername: this.tanme,
                Transportergstin: this.tGSt,
                Grno: this.grno,
                Grdate: this.gdate
            };
        }
        else {
            payload = {
                Containerno: this.contno,
                Linesealno: this.linesno,
                Customsealno: this.custsno,
                Bookingno: this.booknum,
                Placereceipopre: this.pCarrier,
                MaxGrossWt: this.maxgrosswt,
                MaxCargoWt: this.maxcargowt,
                CTareWt: this.ctarewt,

            };
        }

        let that = this;



        // Perform update call with If-Match header
        this.oModel.update(sPath, payload, {
            headers: {
                "If-Match": "*" // Use "*" if etag is not found (not recommended in strict cases)
            },
            success: function (response: any) {
                console.log("Update Successful");
                BusyIndicator.hide();

                // Refresh the Grid instead of navigating
                let oTable = that.byId("_IDGenSmartTable"); // Get the SmartTable control
                if (oTable) {
                    oTable.getModel()?.refresh(true); // Refresh the model to fetch updated data
                } else {
                    console.warn("SmartTable not found. Unable to refresh.");
                }
                (that._pValueHelpDialog as any).close();
            },
            error: function (error: any) {
                console.error("Update Failed", error);
            }
        });
    }

    public async handleSOValueHelp() {
        var oBusyDialog = new BusyDialog({
            text: "Please wait"
        }),
            that = this;
        oBusyDialog.open();

        if (!this._oValueHelpDialog) {
            var oInput1 = this.byId("Transportername") as Input; // Target Transportername field
            var TGSTIN = this.byId("TransporterGSTN") as Input; // Target TransporterGSTN field

            this._oValueHelpDialog = new ValueHelpDialog("SalesOrder2", {
                supportMultiselect: false,
                supportRangesOnly: false,
                stretch: Device.system.phone,
                key: "Supplier",
                descriptionKey: "SupplierFullName",
                filterMode: true,
                ok: function (oEvent: any) {
                    var selectedToken = oEvent.getParameter("tokens")[0]; // Get the first selected token
                    if (selectedToken) {
                        var selectedValue = selectedToken.getText(); // Extract the correct text value
                        that.selectval = selectedValue;
                        that.tanme = selectedValue;
                        oInput1.setValue(selectedValue); // Set value in Transportername field

                        var selectedData = selectedToken.getCustomData()[0].getValue(); // Get additional data
                        if (selectedData && selectedData.TaxNumber3) {
                            that.tGSt = selectedData.TaxNumber3;
                            TGSTIN.setValue(selectedData.TaxNumber3); // Set value in TransporterGSTN field
                        }
                    }
                    that._oValueHelpDialog.close();
                },
                cancel: function () {
                    that._oValueHelpDialog.close();
                }
            });

            // Load Table
            var oTable = (await this._oValueHelpDialog.getTableAsync()) as unknown as Table;
            var oFilterBar = new FilterBar({
                advancedMode: true,
                filterBarExpanded: true,
                showGoOnFB: !Device.system.phone,
                filterGroupItems: [
                    new FilterGroupItem({
                        groupTitle: "Vendor Filter",
                        groupName: "gn1",
                        name: "n1",
                        label: "Search",
                        control: new Input()
                    })
                ],
                search: function (oEvt: any) {
                    oBusyDialog.open();
                    var searchValue = oEvt.getParameter("selectionSet")[0].getValue();
                    if (searchValue === "") {
                        oTable.bindRows({
                            path: "/vendor",
                            parameters: { "$top": "5000" },
                        });
                    } else {
                        oTable.bindRows({
                            path: "/vendor",
                            parameters: { "$top": "5000" },
                            filters: [
                                new Filter({
                                    filters:[
                                        new Filter("Supplier", FilterOperator.Contains, searchValue),
                                        new Filter("SupplierFullName", FilterOperator.Contains, searchValue)
                                    ],
                                    and:false
                                })
                           ] 
                        });
                    }
                    oBusyDialog.close();
                }
            });

            this._oValueHelpDialog.setFilterBar(oFilterBar);

            // Set Columns
            var oColModel = new JSONModel({
                cols: [
                    { label: "Supplier", template: "Supplier" },
                    { label: "Supplier Full Name", template: "SupplierFullName" },
                    { label: "GSTIN", template: "TaxNumber3" }
                ]
            });
            oTable.setModel(oColModel, "columns");

            // Set Data Model
            var oModel = new ODataModel("/sap/opu/odata/sap/ZSB_ZEWAYBILL/");
            oTable.setModel(oModel);
            oTable.bindRows({
                path: "/vendor",
                parameters: { "$top": "5000" },
            });
        }

        oBusyDialog.close();
        this._oValueHelpDialog.open();
    }



    public onClose() {
        (this._pValueHelpDialog as any).close();
    }
    // public openDialog(): void {
    //     let view = (this.byId("_IDGenSmartTable")! as any).getTable();
    //     let selectedIndex = view.getSelectedIndices();
    //     let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
    //     this.Billingdocno = fields.Billingdocno;
    //     this.Bukrs = fields.Bukrs;
    //     let that = this;
    //     if (!this._pValueHelpDialog) {
    //         this.loadFragment({
    //             name: "zirn.view.ValueHelpDialog.updateField",

    //         }).then(function (oWhitespaceDialog: any) {
    //             that._pValueHelpDialog = oWhitespaceDialog;
    //             that.getView()?.addDependent(oWhitespaceDialog);

    //             oWhitespaceDialog.open();
    //         }.bind(this));
    //     } else {
    //         (this._pValueHelpDialog as any).open()
    //     }
    // }

    public openDialog(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        this.Billingdocno = fields.Billingdocno;
        this.Bukrs = fields.Bukrs;
        let that = this;

        // Ensure the dialog is always cleared before opening
        if (this._pValueHelpDialog) {
            (this._pValueHelpDialog as any).destroy();
            this._pValueHelpDialog = null;
        }

        this.loadFragment({
            name: "zirn.view.ValueHelpDialog.updateField",
        }).then(function (oWhitespaceDialog: any) {
            that._pValueHelpDialog = oWhitespaceDialog;
            that.getView()?.addDependent(oWhitespaceDialog);
            oWhitespaceDialog.open();
        }.bind(this));
    }

    public openDialogDetail(): void {
        let view = (this.byId("_IDGenSmartTable")! as any).getTable();
        let selectedIndex = view.getSelectedIndices();
        let fields = view.getContextByIndex(selectedIndex[0]).getProperty();
        this.Billingdocno = fields.Billingdocno;
        this.Bukrs = fields.Bukrs;
        let that = this;

        // Ensure the dialog is always cleared before opening
        if (this._pValueHelpDialog) {
            (this._pValueHelpDialog as any).destroy();
            this._pValueHelpDialog = null;
        }

        this.loadFragment({
            name: "zirn.view.ValueHelpDialog.updatemoreField",
        }).then(function (oWhitespaceDialog: any) {
            that._pValueHelpDialog = oWhitespaceDialog;
            that.getView()?.addDependent(oWhitespaceDialog);
            oWhitespaceDialog.open();
        }.bind(this));
    }


}