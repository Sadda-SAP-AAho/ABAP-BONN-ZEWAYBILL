CLASS zcl_http_irn DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.
    INTERFACES if_http_service_extension .

    CLASS-METHODS create_client
      IMPORTING url           TYPE string
      RETURNING VALUE(result) TYPE REF TO if_web_http_client
      RAISING   cx_static_check.

        CLASS-METHODS get_or_generate_token
      RETURNING VALUE(result) TYPE string.

       CLASS-METHODS getDate
      IMPORTING datestr TYPE string
      RETURNING VALUE(result) TYPE d.

  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.



CLASS ZCL_HTTP_IRN IMPLEMENTATION.


  METHOD create_client.
    DATA(dest) = cl_http_destination_provider=>create_by_url( url ).
    result = cl_web_http_client_manager=>create_by_http_destination( dest ).
  ENDMETHOD.


  METHOD getDate.
    DATA: lv_date_str   TYPE string,
      lv_date       TYPE C LENGTH 10,
      lv_internal   TYPE c length 8.



    lv_date = datestr+0(10). " Extract '2025-04-08'
    REPLACE ALL OCCURRENCES OF '-' IN lv_date WITH ''.
    result = lv_date.

  ENDMETHOD.


   METHOD get_or_generate_token.

*      select SINGLE from zr_integration_tab WITH PRIVILEGED ACCESS
*         fields Intgpath,LastChangedAt
*         where Intgmodule = 'GSP-TOKEN-BEARER'
*         INTO @DATA(token).
*
*         DATA:       lv_date      TYPE d,
*          lv_time      TYPE t,
*          lv_diff      TYPE i.
*
**        Extract date and time from timestamp
*         DATA(datestr) = CONV STRING( token-LastChangedAt ).
*         lv_date = datestr+0(8).   " YYYYMMDD -> 20250320
*         lv_time = datestr+8(6).   " HHMMSS   -> 075828
*
*
**       Convert to system time format
*        DATA(lv_ts_seconds) = ( lv_date - sy-datum ) * 86400 + ( lv_time - sy-uzeit ).
*
*        " Convert 24 hours to seconds
*        DATA(lv_3hours) = 24 * 3600.
*
*        " Compare time difference
*        IF abs( lv_ts_seconds ) < lv_3hours and token-Intgpath ne ''.
*            result = token-Intgpath.
*            RETURN.
*        ENDIF.
*

      select SINGLE from zr_integration_tab
         fields Intgpath
         where Intgmodule = 'GSP-TOKEN-URL'
         INTO @DATA(token_url).

      select SINGLE from zr_integration_tab
         fields Intgpath
         where Intgmodule = 'GSP-TOKEN-HEAD-1'
         INTO @DATA(client_id).

         select SINGLE from zr_integration_tab
         fields Intgpath
         where Intgmodule = 'GSP-TOKEN-HEAD-2'
         INTO @DATA(client_password).

   TRY.
        DATA(client) = create_client( CONV STRING( token_url ) ).
      CATCH cx_static_check INTO DATA(lv_cx_static_check).
        result = lv_cx_static_check->get_longtext( ).
    ENDTRY.

    DATA(req) = client->get_http_request(  ).

    SPLIT client_id  AT ':' INTO DATA(HEAD1NAME) DATA(HEAD1VAL).
    SPLIT client_password  AT ':' INTO DATA(HEAD2NAME) DATA(HEAD2VAL).

    req->set_header_field(
           EXPORTING
           i_name  = HEAD1NAME
             i_value = HEAD1VAL
         ).

     req->set_header_field(
           EXPORTING
           i_name  = HEAD2NAME
             i_value = HEAD2VAL
         ).


    TRY.
        DATA(response) = client->execute( if_web_http_client=>post )->get_text(  ).
      CATCH cx_web_http_client_error INTO DATA(lv_cx_web_http_client_error). "cx_web_message_error.
        result = lv_cx_web_http_client_error->get_longtext( ).
        "handle exception
    ENDTRY.

    REPLACE ALL OCCURRENCES OF '{"access_token":"' IN response WITH ''.
    SPLIT response AT '","token_type' INTO DATA(v1) DATA(v2) .
    result = v1 .

    TRY.
        client->close(  ).

*        update zintegration_tab set Intgpath = @result where Intgmodule = 'GSP-TOKEN-BEARER'.

      CATCH cx_web_http_client_error INTO DATA(lv_cx_web_http_client_error2).
        result = lv_cx_web_http_client_error2->get_longtext( ).
        "handle exception
    ENDTRY.

  ENDMETHOD.


  METHOD if_http_service_extension~handle_request.
    CASE request->get_method(  ).
      WHEN CONV string( if_web_http_client=>post ).
        DATA irn_url TYPE STRING.
        DATA lv_client TYPE REF TO if_web_http_client.
        DATA req TYPE REF TO if_web_http_client.
        DATA lv_client2 TYPE REF TO if_web_http_client.
        DATA req3 TYPE REF TO if_web_http_client.

        DATA: lv_bukrs TYPE ztable_irn-bukrs.
        DATA: lv_invoice TYPE ztable_irn-billingdocno.
        lv_bukrs = request->get_form_field( `companycode` ).
        lv_invoice = request->get_form_field( `document` ).

         SELECT SINGLE FROM ztable_irn AS a
            FIELDS a~irnno
               WHERE a~billingdocno = @lv_invoice AND
               a~bukrs = @lv_bukrs
               INTO @DATA(lv_table_data1).


            IF lv_bukrs IS INITIAL OR lv_invoice IS INITIAL.
              response->set_text( 'Company code and document number are required' ).
              RETURN.
            ELSEIF lv_table_data1 IS NOT INITIAL.
              response->set_text( 'IRN is aready generated' ).
              RETURN.
            ENDIF.


         SELECT SINGLE FROM I_BillingDocumentItem AS b
            FIELDS     b~Plant, b~BillingDocumentType
            WHERE b~BillingDocument = @lv_invoice
            INTO @DATA(lv_document_details) PRIVILEGED ACCESS.

        IF lv_document_details-BillingDocumentType = 'JDC' OR lv_document_details-BillingDocumentType = 'JSN' OR lv_document_details-BillingDocumentType = 'JVR'.
             response->set_text( 'IRN Not Applicatble for this Document Type' ).
             return.
        ENDIF.

         DATA(lv_token) = get_or_generate_token( ).

         select SINGLE from zr_integration_tab
         fields Intgpath
         where Intgmodule = 'IRN-CREATE-URL'
         INTO @irn_url.

          TRY.
          lv_client2 = create_client( irn_url ).

          CATCH cx_static_check INTO DATA(lv_cx_static_check2).
            response->set_text( lv_cx_static_check2->get_longtext( ) ).
        ENDTRY.

        DATA: companycode TYPE string.
        DATA: document    TYPE string.
        DATA: gstno       Type string.


         DATA(get_payload) = zcl_irn_generation=>generated_irn( companycode = lv_bukrs document = lv_invoice ).


        select single from ZI_PlantTable
            Fields GSPPassword, GSPUserName, GstinNo
            where CompCode = @lv_bukrs and PlantCode = @lv_document_details-Plant
            into @DATA(userPass).


         DATA guid TYPE STRING.

         TRY.
           DATA(hex) = cl_system_uuid=>create_uuid_x16_static( ).
           guid = |{ hex(4) }-{ hex+4(2) }-{ hex+6(2) }-{ hex+8(2) }-{ hex+10(6) }|.
          CATCH cx_uuid_error INTO DATA(lo_error).
           response->set_text( 'GUID geration has some error' ).
         ENDTRY.


        DATA(req4) = lv_client2->get_http_request( ).

        req4->set_header_field(
           EXPORTING
           i_name  = 'user_name'
             i_value = CONV string( userPass-GSPUserName )
         ).

         req4->set_header_field(
           EXPORTING
           i_name  = 'password'
             i_value = CONV string( userPass-GSPPassword )
         ).

         req4->set_header_field(
           EXPORTING
           i_name  = 'gstin'
             i_value = CONV string( userPass-GstinNo )
         ).

          req4->set_header_field(
           EXPORTING
           i_name  = 'requestid'
             i_value = guid
         ).

         req4->set_authorization_bearer( lv_token ).
         req4->set_text( get_payload ).
         req4->set_content_type( 'application/json' ).
        DATA url_response2 TYPE string.

        TRY.
             url_response2 = lv_client2->execute( if_web_http_client=>post )->get_text( ).
             DATA: wa_zirn TYPE ztable_irn.

              TYPES: BEGIN OF ty_message,
                     ackno  TYPE string,
                     ackdt  TYPE string,
                     irn    TYPE string,
                     status TYPE string,
                     SignedInvoice type string,
                     SignedQRCode type string,
                      EwbNo  TYPE string,
                     EwbDt  TYPE string,
                     EwbvalidTill TYPE string,
                   END OF ty_message.


             IF url_response2+11(5) = 'false'.

                TYPES: BEGIN OF ty_message4,
                     desc    TYPE ty_message,
                     InfCd   TYPE string,
                   END OF ty_message4.

                  TYPES: BEGIN OF ty_message2,
                     message TYPE string,
                     result TYPE TABLE OF ty_message4 WITH EMPTY KEY ,
                     status  TYPE string,
                   END OF ty_message2.

                DATA lv_message TYPE ty_message2.

                xco_cp_json=>data->from_string( url_response2 )->write_to( REF #( lv_message ) ).
                if lv_message-message = '2150 : Duplicate IRN'.
                    loop at lv_message-result into Data(irn).
                      SELECT SINGLE * FROM ztable_irn AS a
                         WHERE a~billingdocno = @lv_invoice AND
                         a~bukrs = @lv_bukrs
                         INTO @DATA(lv_table_data).

                         wa_zirn = lv_table_data.
                         wa_zirn-irnno = irn-desc-irn.
                         wa_zirn-ackno = irn-desc-ackno.
                         wa_zirn-ackdate = irn-desc-ackdt.

                         MODIFY ztable_irn FROM @wa_zirn.
                    ENDLOOP.
                ENDIF.

                    response->set_text( lv_message-message ).
                    return.
            ELSE.

                   TYPES: BEGIN OF ty_message3,
                     message TYPE string,
                     result TYPE  ty_message ,
                     status  TYPE string,
                   END OF ty_message3.

                     DATA lv_message1 TYPE ty_message3.
                     DATA ewbres TYPE STRING.

                    xco_cp_json=>data->from_string( url_response2 )->write_to( REF #( lv_message1 ) ).

                     SELECT SINGLE * FROM ztable_irn AS a
                     WHERE a~billingdocno = @lv_invoice AND
                     a~bukrs = @lv_bukrs
                     INTO @DATA(lv_table_data2).
                     wa_zirn = lv_table_data2.
                     wa_zirn-irnno = lv_message1-result-irn.
                     wa_zirn-ackno = lv_message1-result-ackno.
                     wa_zirn-ackdate = lv_message1-result-ackdt.
                     wa_zirn-irnstatus = 'GEN'.
                     wa_zirn-signedinvoice = lv_message1-result-signedinvoice.
                     wa_zirn-signedqrcode = lv_message1-result-signedqrcode.
                     wa_zirn-ewaybillno = lv_message1-result-ewbno.
                     wa_zirn-ewaydate = lv_message1-result-ewbdt.
                     if wa_zirn-ewaybillno NE ''.
                        wa_zirn-ewaystatus = 'GEN'.
                        wa_zirn-ewayvaliddate = getDate( lv_message1-result-ewbvalidtill ).
                        ewbres = | with Eway Bill No - { wa_zirn-ewaybillno }|.
                     ENDIF.



                     MODIFY ztable_irn FROM @wa_zirn.


                    response->set_text( | Irn no for document no - { lv_invoice } is { lv_message1-result-irn } Generated Successfully{ ewbres }. | ).


            ENDIF.

*


          CATCH cx_web_http_client_error INTO DATA(lv_error_response2).
            response->set_text( lv_error_response2->get_longtext( ) ).
        ENDTRY.
    ENDCASE.
  ENDMETHOD.
ENDCLASS.
