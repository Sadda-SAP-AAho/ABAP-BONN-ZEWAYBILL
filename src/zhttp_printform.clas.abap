 CLASS zhttp_printform DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_http_service_extension.
  PROTECTED SECTION.
  PRIVATE SECTION.
    CLASS-DATA url TYPE string.
ENDCLASS.



CLASS ZHTTP_PRINTFORM IMPLEMENTATION.


  METHOD if_http_service_extension~handle_request.


    TRY.

        DATA(req) = request->get_form_fields(  ).
        response->set_header_field( i_name = 'Access-Control-Allow-Origin' i_value = '*' ).
        response->set_header_field( i_name = 'Access-Control-Allow-Credentials' i_value = 'true' ).
        DATA(cookies)  = request->get_cookies(  ) .

        DATA req_host TYPE string.
        DATA req_proto TYPE string.
        DATA json TYPE string .

        req_host = request->get_header_field( i_name = 'Host' ).
        req_proto = request->get_header_field( i_name = 'X-Forwarded-Proto' ).
        IF req_proto IS INITIAL.
          req_proto = 'https'.

        ENDIF.
        DATA(symandt) = sy-mandt.
        DATA(printname) = VALUE #( req[ name = 'print' ]-value OPTIONAL ).
        DATA(cc) = request->get_form_field( `companycode` ).
        DATA(doc) = request->get_form_field( `document` ).
        DATA(getdocument) = VALUE #( req[ name = 'doc' ]-value OPTIONAL ).
        DATA(getcompanycode) = VALUE #( req[ name = 'cc' ]-value OPTIONAL ).
        DATA(SalesQuotation) = VALUE #( req[ name = 'salesquotation' ]-value OPTIONAL ).
        DATA(SalesQuotationType) = VALUE #( req[ name = 'salesquotationtype' ]-value OPTIONAL ).


*        " Get request data
*        DATA(req) = request->get_form_fields( ).
*        response->set_header_field( i_name = 'Access-Control-Allow-Origin' i_value = '*' ).
*        response->set_header_field( i_name = 'Access-Control-Allow-Credentials' i_value = 'true' ).
*
*        " Process request parameters
*        DATA(printname) = VALUE #( req[ name = 'print' ]-value OPTIONAL ).
*        DATA(doc) = request->get_form_field( `document` ).
*        DATA(cc) = request->get_form_field( `companycode` ).
*        DATA(salesquotation) = VALUE #( req[ name = 'salesquotation' ]-value OPTIONAL ).
*        DATA(salesquotationtype) = VALUE #( req[ name = 'salesquotationtype' ]-value OPTIONAL ).
*
        " Process sales quotation formatting
        IF strlen( salesquotation ) = 8.
          CONCATENATE '00' salesquotation INTO salesquotation.
        ELSEIF strlen( salesquotation ) = 9.
          CONCATENATE '0' salesquotation INTO salesquotation.
        ENDIF.

        IF salesquotationtype = 'QT'.
          salesquotationtype = 'AG'.
        ENDIF.
        IF printname = 'stoOriginal' or printname = 'stoDuplicate' or printname = 'stoOffice'.
         SELECT SINGLE FROM zintegration_tab AS a FIELDS a~intgpath WHERE a~intgmodule = 'TAXINVOICE' INTO @DATA(wa_int).
        ELSEIF printname = 'expoOriginal' or printname = 'expoTransporter' or printname = 'expoOffice'.
         SELECT SINGLE from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'EXPORTINVOICE' into @wa_int .
        ELSEIF printname = 'DCOriginal' OR printname = 'DCDuplicate' OR  printname = 'DCOffice' .
         SELECT SINGLE from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'DELIVERYCHALLAN' into @wa_int .
        ELSEIF printname = 'PL'.
         SELECT SINGLE from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'PACKINGLIST' into @wa_int .
        ELSEIF printname = 'COMINV'.
         SELECT SINGLE from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'CommercialInvoice' into @wa_int .
        ELSEIF printname = 'CUSINV'.
         SELECT SINGLE from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'CustomInvoice' into @wa_int .
         ELSEIF printname = 'CusPL'.
         SELECT SINGLE from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'CustomPackinglist' into @wa_int .
         ElseIF printname = 'CreditNote'.
         select single from zintegration_tab as A FIELDS a~intgpath where a~intgmodule = 'CREDITNOTE' into @wa_int .
         ENDIF.
        CASE request->get_method( ).
          WHEN CONV string( if_web_http_client=>get ).
            " GET method processing
            DATA: getresult TYPE string.
            IF printname = 'stoOriginal' OR printname = 'stoDuplicate' OR printname = 'stoOffice' OR printname = 'expoOriginal' OR printname = 'expoTransporter' OR printname = 'expoOffice' OR printname = 'PL' OR
               printname = 'COMINV' OR printname = 'CUSINV' OR printname = 'CusPL'.
              SELECT SINGLE DistributionChannel, BillingDocumentType
              FROM I_BillingDocument
              WHERE BillingDocument = @getdocument AND CompanyCode = @getcompanycode
              INTO @DATA(wa_check).
              getresult = ( wa_check-DistributionChannel ).
*              getresult = |DistributionChannel: { wa_check-DistributionChannel }, BillingDocumentType: { wa_check-BillingDocumentType }|.

*                    response->set_text( wa_check-DistributionChannel ).
            ELSEIF printname = 'DCOriginal' or printname = 'DCDuplicate' or printname = 'DCOffice'.
              SELECT Single BillingDocumentType , BillingDocument
              FROM I_BillingDocument
              WHERE BillingDocument = @getdocument AND CompanyCode = @getcompanycode
              INTO @data(wa_type).
              getresult = wa_type-BillingDocumentType.

*                    response->set_text( wa_check-BillingDocumentType ).
            ELSEIF printname = 'PerForma'.
              SELECT SINGLE SalesQuotationType
              FROM I_SalesQuotation
              WHERE SalesQuotation = @salesquotation
              INTO @DATA(wa).
              getresult = wa .

            ElseIF printname = 'CreditNote'.
              SELECT SINGLE BillingDocumentType
              FROM I_BillingDocument
              WHERE BillingDocument = @getdocument AND CompanyCode = @getcompanycode
              INTO @DATA(wa_credit).

              getresult = wa_credit.
            ENDIF.
            response->set_text( getresult ).

          WHEN CONV string( if_web_http_client=>post ).
            " POST method processing
            SELECT SINGLE *
            FROM I_BillingDocument
            WHERE BillingDocument = @doc AND CompanyCode = @cc
            INTO @DATA(lv_invoice).

*                 salesquotaion
            SELECT SINGLE * FROM i_salesquotation AS a
           WHERE a~SalesQuotation = @salesquotation  AND a~SalesQuotationType = @salesquotationtype
           INTO @DATA(lv_performa).

            SELECT SINGLE BillingDocumentIsCancelled, AccountingPostingStatus
            FROM I_BillingDocument
            WHERE BillingDocument = @doc AND CompanyCode = @cc
            INTO @DATA(wa_validprint).

            IF printname = 'stoOriginal' OR
               printname = 'stoDuplicate' OR
               printname = 'stoOffice' OR
               printname = 'expoOriginal' OR
               printname = 'expoTransporter' OR
               printname = 'expoOffice' OR
               printname = 'CreditNote'.
              IF wa_validprint-BillingDocumentIsCancelled = 'X'.
                response->set_text( 'This invoice has already been cancelled.' ).
                RETURN.
              ELSEIF wa_validprint-AccountingPostingStatus <> 'C'.
                response->set_text( 'The document is not yet released for this invoice.' ).
                RETURN.
              ELSE.
                IF lv_invoice IS NOT INITIAL.
                  DATA(pdf) = zcl_sto_tax_inv_dr=>read_posts(
                      bill_doc = doc
                      printForm = printname
                      lc_template_name = SWITCH #( printname
                          WHEN 'stoOriginal' THEN wa_int
                          WHEN 'stoDuplicate' THEN 'ZBonnTaxInvoice/ZBonnTaxInvoice'
                          WHEN 'stoOffice'  THEN 'ZBonnTaxInvoice/ZBonnTaxInvoice'
                          WHEN 'expoOriginal' THEN 'ZBonnExportInvoice/ZBonnExportInvoice'
                          WHEN 'expoTransporter' THEN 'ZBonnExportInvoice/ZBonnExportInvoice'
                          WHEN 'expoOffice' THEN 'ZBonnExportInvoice/ZBonnExportInvoice'
                          when 'CreditNote' then 'ZBonnCreditNote/ZBonnCreditNote' ) ).

                  IF pdf = 'ERROR'.
                    response->set_text( 'Error generating PDF. Please check the document data.' ).
                  ELSE.
                    response->set_header_field( i_name = 'Content-Type' i_value = 'text/html' ).
                    response->set_text( pdf ).
                  ENDIF.
                ENDIF.
              ENDIF.
            ENDIF.

            IF printname = 'DCOriginal' or printname = 'DCDuplicate' or printname = 'DCOffice' OR  printname = 'PL' OR  printname = 'CusPL' OR  printname = 'CUSINV' OR  printname = 'COMINV' .
              IF wa_validprint-BillingDocumentIsCancelled = 'X'.
                response->set_text( 'This invoice has already been cancelled.' ).
                RETURN.
              ELSE.
                IF lv_invoice IS NOT INITIAL.
                  pdf = zcl_sto_tax_inv_dr=>read_posts(
                     bill_doc = doc
                      printForm = printname
                     lc_template_name = SWITCH #( printname
                         WHEN 'DCOriginal' THEN 'ZBonnDeliveryChallan/ZBonnDeliveryChallan'
                         when 'DCDuplicate' then 'ZBonnDeliveryChallan/ZBonnDeliveryChallan'
                         WHEN 'DCOffice'  THEN 'ZBonnDeliveryChallan/ZBonnDeliveryChallan'
                         WHEN 'PL' THEN 'ZBonnPackingList/ZBonnPackingList'
                         WHEN 'COMINV' THEN 'ZCommercialInvoice/ZCommercialInvoice'
                         WHEN 'CusPL' THEN 'ZCUSTOMPKG/ZCUSTOMPKG'
                         WHEN 'CUSINV' THEN 'ZCUSTOM_INVOICE/ZCUSTOM_INVOICE' ) ).

                  IF pdf = 'ERROR'.
                    response->set_text( 'Error generating PDF. Please check the document data.' ).
                  ELSE.
                    response->set_header_field( i_name = 'Content-Type' i_value = 'text/html' ).
                    response->set_text( pdf ).
                  ENDIF.
                ENDIF.
              ENDIF.
            ENDIF.

            IF printname = 'PerForma'.
              IF wa_validprint-BillingDocumentIsCancelled = 'X'.
                response->set_text( 'This invoice has already been cancelled.' ).
                RETURN.
               ELSE.
               if lv_performa IS NOT INITIAL.
                 pdf = zcl_performainvoice=>read_posts( salesQT = salesquotation  lc_template_name = 'ZBONNPERFORMA/ZBONNPERFORMA' ).
                IF pdf = 'ERROR'.
                    response->set_text( 'Error generating PDF. Please check the document data.' ).
                  ELSE.
                    response->set_header_field( i_name = 'Content-Type' i_value = 'text/html' ).
                    response->set_text( pdf ).
                ENDIF.
              ENDIF.
              ENDIF.
            ENDIF.
        ENDCASE.

      CATCH cx_static_check INTO DATA(lx_static).
        response->set_status( i_code = 500 ).
        response->set_text( lx_static->get_text( ) ).
      CATCH cx_root INTO DATA(lx_root).
        response->set_status( i_code = 500 ).
        response->set_text( lx_root->get_text( ) ).
    ENDTRY.
  ENDMETHOD.
ENDCLASS.
