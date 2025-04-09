CLASS zcl_eway_generation DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.

    TYPES: BEGIN OF ty_item_list,
             productName          TYPE string,
             productDesc          TYPE string,
             hsnCode              TYPE int4,
             quantity             TYPE P length 13 decimals 2,
             qtyUnit              TYPE string,
             cgstRate            TYPE P length 13 decimals 2,
             sgstRate            TYPE P length 13 decimals 2,
             igstRate            TYPE P length 13 decimals 2,
             cessRate            TYPE P length 13 decimals 2,
             cessAdvol         TYPE P length 13 decimals 2,
             taxableAmount       TYPE P length 13 decimals 2,
           END OF ty_item_list.
    CLASS-DATA itemList TYPE TABLE OF ty_item_list.
    TYPES: BEGIN OF ty_final,
            supplyType       TYPE string,
             subSupplyType    TYPE string,
             subSupplyDesc    TYPE string,
             docType          TYPE string,
             docNo            TYPE string,
             docDate          TYPE string,
             fromGstin        TYPE string,
             fromTrdName      TYPE string,
             transactionType  TYPE INT1,
             fromLglName      TYPE string,
             fromAddr1        TYPE string,
             fromAddr2        TYPE string,
             fromPlace        TYPE string,
             fromPincode      TYPE int4,
             actFromStateCode TYPE int4,
             fromStateCode    TYPE int4,
             toGstin          TYPE string,
             toTrdName        TYPE string,
             toLglName        TYPE string,
             toAddr1          TYPE string,
             toAddr2          TYPE string,
             toPlace          TYPE string,
             toPincode        TYPE int4,
             actToStateCode   TYPE int4,
             toStateCode      TYPE int4,
             totalValue       TYPE P length 13 decimals 2,
             cgstValue        TYPE P length 13 decimals 2,
             sgstValue        TYPE P length 13 decimals 2,
             igstValue        TYPE P length 13 decimals 2,
             cessValue        TYPE P length 13 decimals 2,
             totInvValue      TYPE P length 13 decimals 2,
             transporterId    TYPE string,
             transporterName  TYPE string,
             transDocNo       TYPE string,
             transMode        TYPE string,
             transDistance    TYPE string,
             transDocDate     TYPE string,  " Consider converting to DATS if needed
             vehicleNo        TYPE string,
             vehicleType      TYPE string,
             itemList                    LIKE itemList,
           END OF ty_final.

    CLASS-DATA: wa_final TYPE ty_final.
    CLASS-METHODS :generated_eway_bill IMPORTING
                                                 invoice       TYPE ztable_irn-billingdocno
                                                 companycode   TYPE ztable_irn-bukrs
                                       RETURNING VALUE(result) TYPE string.
protected section.
private section.
ENDCLASS.



CLASS ZCL_EWAY_GENERATION IMPLEMENTATION.


  METHOD generated_eway_bill.

  DATA :        wa_itemlist TYPE ty_item_list.

     SELECT SINGLE FROM i_billingdocument AS a
    INNER JOIN I_BillingDocumentItem AS b ON a~BillingDocument = b~BillingDocument
    FIELDS a~BillingDocument,
    a~BillingDocumentType,
    a~BillingDocumentDate,a~DistributionChannel,
    b~Plant,a~CompanyCode, a~DocumentReferenceID
    WHERE a~BillingDocument = @invoice
    INTO @DATA(lv_document_details) PRIVILEGED ACCESS.

    DATA SupType Type STRING.

    IF lv_document_details-DistributionChannel ne 'EX'.
        SupType = 'B2B'.
    ELSE.
        SupType = 'EXPWP'.
    ENDIF.

    DATA DocDate TYPE STRING.

    SHIFT lv_document_details-BillingDocument LEFT DELETING LEADING '0'.
    wa_final-docno      = lv_document_details-DocumentReferenceID.
    DocDate             = lv_document_details-BillingDocumentDate+6(2) && '/' && lv_document_details-BillingDocumentDate+4(2) && '/' && lv_document_details-BillingDocumentDate(4).
    wa_final-docdate    = DocDate.


    SELECT SINGLE FROM ztable_plant
    fields gstin_no, city, address1, address2, pin, state_code1,plant_name1
    WHERE plant_code = @lv_document_details-plant and comp_code = @lv_document_details-CompanyCode INTO @DATA(sellerplantaddress) PRIVILEGED ACCESS.

    wa_final-fromgstin    =  sellerplantaddress-gstin_no.
    wa_final-fromtrdname  =  sellerplantaddress-plant_name1.
    wa_final-fromlglname =  sellerplantaddress-plant_name1.
    wa_final-fromaddr1    =  sellerplantaddress-address1.
    wa_final-fromaddr2    =  sellerplantaddress-address2 .
    wa_final-fromplace     =  sellerplantaddress-address2 .
    IF sellerplantaddress-city IS NOT INITIAL.
      wa_final-fromplace      =  sellerplantaddress-city .
    ENDIF.
    wa_final-fromstatecode     =  sellerplantaddress-state_code1.
    wa_final-actfromstatecode     =  sellerplantaddress-state_code1.
    wa_final-frompincode      =  sellerplantaddress-pin.


     SELECT SINGLE * FROM i_billingdocumentpartner AS a  INNER JOIN i_customer AS
            b ON ( a~customer = b~customer  ) WHERE a~billingdocument = @invoice
             AND a~partnerfunction = 'RE' INTO  @DATA(buyeradd) PRIVILEGED ACCESS.

    if SupType = 'EXPWP'.
        wa_final-togstin = 'URP'.
        wa_final-topincode   = '999999'  .
        wa_final-tostatecode  = '96'  .
        wa_final-acttostatecode  = '96'  .
        wa_final-toplace = '96'.

    else.
        wa_final-togstin = buyeradd-b-taxnumber3.
        wa_final-topincode   = buyeradd-b-postalcode  .
        wa_final-tostatecode  = buyeradd-b-TaxNumber3+0(2)  .
        wa_final-acttostatecode  = buyeradd-b-TaxNumber3+0(2)  .

        IF wa_final-togstin <> ''.
          wa_final-toplace = wa_final-togstin+0(2).
        ENDIF.

    ENDIF.

    wa_final-tolglname = buyeradd-b-customername.
    wa_final-totrdname = buyeradd-b-customername.
    wa_final-toaddr1 = buyeradd-b-customerfullname.
    wa_final-toaddr2 = ''.




    wa_final-toplace   = buyeradd-b-cityname .
    wa_final-topincode   = buyeradd-b-postalcode  .
    wa_final-tostatecode  = buyeradd-b-TaxNumber3+0(2)  .
    wa_final-acttostatecode  = buyeradd-b-TaxNumber3+0(2).

    wa_final-transactiontype = 1.
    wa_final-supplytype = 'O'.
    IF lv_document_details-BillingDocumentType = 'JDC' OR lv_document_details-BillingDocumentType = 'JSN' OR lv_document_details-BillingDocumentType = 'JVR' OR lv_document_details-BillingDocumentType = 'JSP'.
        wa_final-subsupplytype = '5'.
        wa_final-doctype = 'CHL'.
    ELSE.
        wa_final-subsupplytype = '1'.
        wa_final-doctype = 'INV'.
    ENDIF.




    select single from zr_zirntp
    FIELDS Transportername, Vehiclenum, Grdate, Grno, Transportergstin
    where Billingdocno = @invoice and Bukrs = @companycode
    INTO @DATA(Eway).

    wa_final-vehicleno = Eway-Vehiclenum .
    wa_final-transportername = Eway-Transportername .
    wa_final-transdocdate = Eway-Grdate+6(2) && '/' && Eway-Grdate+4(2) && '/' && Eway-Grdate(4).
    wa_final-transdocno = Eway-Grno .
    wa_final-transporterid = Eway-Transportergstin .
    wa_final-transmode = '1'.
    IF wa_final-topincode NE wa_final-frompincode.
        wa_final-transdistance = 0.
    ELSE.
        wa_final-transdistance = 10.
    ENDIF.
    wa_final-vehicletype = 'R'.

    SELECT FROM I_BillingDocumentItem AS item
        LEFT JOIN I_ProductDescription AS pd ON item~Product = pd~Product AND pd~LanguageISOCode = 'EN'
        LEFT JOIN i_productplantbasic AS c ON item~Product = c~Product and item~Plant = c~Plant
        FIELDS item~BillingDocument, item~BillingDocumentItem
        , item~Plant, item~ProfitCenter, item~Product, item~BillingQuantity, item~BaseUnit, item~BillingQuantityUnit, item~NetAmount,
             item~TaxAmount, item~TransactionCurrency, item~CancelledBillingDocument, item~BillingQuantityinBaseUnit,
             pd~ProductDescription,
             c~consumptiontaxctrlcode
        WHERE item~BillingDocument = @invoice AND consumptiontaxctrlcode IS NOT INITIAL
           INTO TABLE @DATA(ltlines).

      SELECT FROM I_BillingDocItemPrcgElmntBasic FIELDS BillingDocument , BillingDocumentItem, ConditionRateValue, ConditionAmount, ConditionType,
        transactioncurrency AS d_transactioncurrency
        WHERE BillingDocument = @invoice
        INTO TABLE @DATA(it_price).

      LOOP AT ltlines INTO DATA(wa_lines).
        wa_itemlist-productname = wa_lines-ProductDescription.
        wa_itemlist-productdesc = wa_lines-ProductDescription.
        wa_itemlist-hsncode = wa_lines-consumptiontaxctrlcode.
        wa_itemlist-quantity = wa_lines-BillingQuantity.


        select single from zgstuom
        FIELDS gstuom
        where uom = @wa_lines-BillingQuantityUnit "and bukrs = @wa_lines-CompanyCode
        into @DATA(UOM).

        if UOM is INITIAL.
            wa_itemlist-qtyunit = wa_lines-BillingQuantityUnit.
        ELSE.
            wa_itemlist-qtyunit = UOM.
        ENDIF.


         READ TABLE it_price INTO DATA(wa_price1) WITH KEY BillingDocument = wa_lines-BillingDocument
                                                         BillingDocumentItem = wa_lines-BillingDocumentItem
                                                         ConditionType = 'JOIG'.
        if wa_price1 is not INITIAL.
            wa_itemlist-igstrate                       = wa_price1-ConditionRateValue.
            CLEAR wa_price1.

        ELSE.

            READ TABLE it_price INTO DATA(wa_price2) WITH KEY BillingDocument = wa_lines-BillingDocument
                                                             BillingDocumentItem = wa_lines-BillingDocumentItem
                                                             ConditionType = 'JOSG'.
            wa_itemlist-sgstrate                    = wa_price2-ConditionRateValue.

             READ TABLE it_price INTO DATA(wa_price3) WITH KEY BillingDocument = wa_lines-BillingDocument
                                                             BillingDocumentItem = wa_lines-BillingDocumentItem
                                                             ConditionType = 'JOCG'.
            wa_itemlist-cgstrate                    = wa_price3-ConditionRateValue.

            CLEAR : wa_price2,wa_price3.
        ENDIF.



         wa_itemlist-taxableamount = wa_lines-NetAmount.


          wa_final-totalvalue   +=   + wa_itemlist-taxableamount.
          IF wa_itemlist-igstrate ne 0.
              wa_final-igstvalue +=  wa_itemlist-taxableamount *  ( wa_itemlist-igstrate / 100  ).
          ENDIF.

          if wa_itemlist-cgstrate ne 0.
              wa_final-cgstvalue +=  wa_itemlist-taxableamount * ( wa_itemlist-cgstrate / 100 ).
          ENDIF.

          If wa_itemlist-sgstrate ne 0.
              wa_final-sgstvalue +=  wa_itemlist-taxableamount *  ( wa_itemlist-sgstrate / 100 ).
          ENDIF.



      APPEND wa_itemlist TO itemList.
      CLEAR :  wa_itemlist.
    ENDLOOP.

      wa_final-totinvvalue = wa_final-totalvalue + wa_final-igstvalue + wa_final-cgstvalue + wa_final-sgstvalue .
      wa_final-itemlist = itemList.

    DATA:json TYPE REF TO if_xco_cp_json_data.

    xco_cp_json=>data->from_abap(
      EXPORTING
        ia_abap      = wa_final
      RECEIVING
        ro_json_data = json   ).
    json->to_string(
      RECEIVING
        rv_string =   DATA(lv_string) ).

    REPLACE ALL OCCURRENCES OF '"SUPPLYTYPE"' IN lv_string WITH '"supplyType"'.
    REPLACE ALL OCCURRENCES OF '"SUBSUPPLYTYPE"' IN lv_string WITH '"subSupplyType"'.
    REPLACE ALL OCCURRENCES OF '"SUBSUPPLYDESC"' IN lv_string WITH '"subSupplyDesc"'.
    REPLACE ALL OCCURRENCES OF '"TRANSACTIONTYPE"' IN lv_string WITH '"transactionType"'.
    REPLACE ALL OCCURRENCES OF '"DOCTYPE"' IN lv_string WITH '"docType"'.
    REPLACE ALL OCCURRENCES OF '"DOCNO"' IN lv_string WITH '"docNo"'.
    REPLACE ALL OCCURRENCES OF '"DOCDATE"' IN lv_string WITH '"docDate"'.
    REPLACE ALL OCCURRENCES OF '"FROMGSTIN"' IN lv_string WITH '"fromGstin"'.
    REPLACE ALL OCCURRENCES OF '"FROMTRDNAME"' IN lv_string WITH '"fromTrdName"'.
    REPLACE ALL OCCURRENCES OF '"FROMLGLNAME"' IN lv_string WITH '"fromLglName"'.
    REPLACE ALL OCCURRENCES OF '"FROMADDR1"' IN lv_string WITH '"fromAddr1"'.
    REPLACE ALL OCCURRENCES OF '"FROMADDR2"' IN lv_string WITH '"fromAddr2"'.
    REPLACE ALL OCCURRENCES OF '"FROMPLACE"' IN lv_string WITH '"fromPlace"'.
    REPLACE ALL OCCURRENCES OF '"FROMPINCODE"' IN lv_string WITH '"fromPincode"'.
    REPLACE ALL OCCURRENCES OF '"ACTFROMSTATECODE"' IN lv_string WITH '"actFromStateCode"'.
    REPLACE ALL OCCURRENCES OF '"FROMSTATECODE"' IN lv_string WITH '"fromStateCode"'.
    REPLACE ALL OCCURRENCES OF '"TOGSTIN"' IN lv_string WITH '"toGstin"'.
    REPLACE ALL OCCURRENCES OF '"TOTRDNAME"' IN lv_string WITH '"toTrdName"'.
    REPLACE ALL OCCURRENCES OF '"TOLGLNAME"' IN lv_string WITH '"toLglName"'.
    REPLACE ALL OCCURRENCES OF '"TOADDR1"' IN lv_string WITH '"toAddr1"'.
    REPLACE ALL OCCURRENCES OF '"TOADDR2"' IN lv_string WITH '"toAddr2"'.
    REPLACE ALL OCCURRENCES OF '"TOPLACE"' IN lv_string WITH '"toPlace"'.
    REPLACE ALL OCCURRENCES OF '"TOPINCODE"' IN lv_string WITH '"toPincode"'.
    REPLACE ALL OCCURRENCES OF '"ACTTOSTATECODE"' IN lv_string WITH '"actToStateCode"'.
    REPLACE ALL OCCURRENCES OF '"TOSTATECODE"' IN lv_string WITH '"toStateCode"'.
    REPLACE ALL OCCURRENCES OF '"TOTALVALUE"' IN lv_string WITH '"totalValue"'.
    REPLACE ALL OCCURRENCES OF '"CGSTVALUE"' IN lv_string WITH '"cgstValue"'.
    REPLACE ALL OCCURRENCES OF '"SGSTVALUE"' IN lv_string WITH '"sgstValue"'.
    REPLACE ALL OCCURRENCES OF '"IGSTVALUE"' IN lv_string WITH '"igstValue"'.
    REPLACE ALL OCCURRENCES OF '"CESSVALUE"' IN lv_string WITH '"cessValue"'.
    REPLACE ALL OCCURRENCES OF '"TOTINVVALUE"' IN lv_string WITH '"totInvValue"'.
    REPLACE ALL OCCURRENCES OF '"TRANSPORTERID"' IN lv_string WITH '"transporterId"'.
    REPLACE ALL OCCURRENCES OF '"TRANSPORTERNAME"' IN lv_string WITH '"transporterName"'.
    REPLACE ALL OCCURRENCES OF '"TRANSDOCNO"' IN lv_string WITH '"transDocNo"'.
    REPLACE ALL OCCURRENCES OF '"TRANSMODE"' IN lv_string WITH '"transMode"'.
    REPLACE ALL OCCURRENCES OF '"TRANSDISTANCE"' IN lv_string WITH '"transDistance"'.
    REPLACE ALL OCCURRENCES OF '"TRANSDOCDATE"' IN lv_string WITH '"transDocDate"'.
    REPLACE ALL OCCURRENCES OF '"VEHICLENO"' IN lv_string WITH '"vehicleNo"'.
    REPLACE ALL OCCURRENCES OF '"VEHICLETYPE"' IN lv_string WITH '"vehicleType"'.
    REPLACE ALL OCCURRENCES OF '"ITEMLIST"' IN lv_string WITH '"itemList"'.
    REPLACE ALL OCCURRENCES OF '"PRODUCTNAME"' IN lv_string WITH '"productName"'.
    REPLACE ALL OCCURRENCES OF '"PRODUCTDESC"' IN lv_string WITH '"productDesc"'.
    REPLACE ALL OCCURRENCES OF '"HSNCODE"' IN lv_string WITH '"hsnCode"'.
    REPLACE ALL OCCURRENCES OF '"QUANTITY"' IN lv_string WITH '"quantity"'.
    REPLACE ALL OCCURRENCES OF '"QTYUNIT"' IN lv_string WITH '"qtyUnit"'.
    REPLACE ALL OCCURRENCES OF '"CGSTRATE"' IN lv_string WITH '"cgstRate"'.
    REPLACE ALL OCCURRENCES OF '"SGSTRATE"' IN lv_string WITH '"sgstRate"'.
    REPLACE ALL OCCURRENCES OF '"IGSTRATE"' IN lv_string WITH '"igstRate"'.
    REPLACE ALL OCCURRENCES OF '"CESSRATE"' IN lv_string WITH '"cessRate"'.
    REPLACE ALL OCCURRENCES OF '"CESSADVOL"' IN lv_string WITH '"cessAdvol"'.
    REPLACE ALL OCCURRENCES OF '"TAXABLEAMOUNT"' IN lv_string WITH '"taxableAmount"'.

    REPLACE ALL OCCURRENCES OF '"transporterId":""' IN lv_string WITH '"transporterId":null'.
    REPLACE ALL OCCURRENCES OF '"transporterName":""' IN lv_string WITH '"transporterName":null'.
    REPLACE ALL OCCURRENCES OF '"transDocNo":""' IN lv_string WITH '"transDocNo":null'.
    REPLACE ALL OCCURRENCES OF '"transDocDate":"00/00/0000"' IN lv_string WITH |"transDocDate":"{ DocDate }"|.
    REPLACE ALL OCCURRENCES OF '"transDocDate":""' IN lv_string WITH |"transDocDate":"{ DocDate }"|.
    REPLACE ALL OCCURRENCES OF '0 "' IN lv_string WITH '0"'.


    result = lv_string.

  ENDMETHOD.
ENDCLASS.
