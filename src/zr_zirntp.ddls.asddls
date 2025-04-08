@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@EndUserText.label: 'CDS View forZIRN'
define root view entity ZR_ZIRNTP
  as select from ztable_irn as ZIRN
{
  key bukrs                 as Bukrs,
      @EndUserText.label: 'Document No'
  key billingdocno          as Billingdocno,
      moduletype            as Moduletype,
      plant                 as Plant,
      @EndUserText.label: 'Document Date'
      billingdate           as Billingdate,
      partycode             as Partycode,
      distributionchannel   as distributionchannel,
      billingdocumenttype   as billingdocumenttype,
      partyname             as Partyname,
      irnno                 as Irnno,
      ackno                 as Ackno,
      ackdate               as Ackdate,
      documentreferenceid   as documentreferenceid,
      irnstatus             as Irnstatus,
      canceldate         as Canceldate,
      irncanceldate         as IRNCancelDate,
      ewayvaliddate         as EwayValidDate,
      signedinvoice         as Signedinvoice,
      signedqrcode          as Signedqrcode,
      distance              as Distance,
      vehiclenum            as Vehiclenum,
      ewaybillno            as Ewaybillno,
      ewaydate              as Ewaydate,
      ewaystatus            as Ewaystatus,
      ewaycanceldate        as Ewaycanceldate,
      @Semantics.user.createdBy: true
      irncreatedby          as Irncreatedby,
      ewaycreatedby         as Ewaycreatedby,
      transportername       as Transportername,
      transportergstin      as Transportergstin,
      grno                  as Grno,
      grdate                as Grdate,
      containerno           as Containerno,
      linesealno            as Linesealno,
      customsealno          as Customsealno,
      grossweight           as Grossweight,  
      netweight             as Netweight,
      maxgrosswt            as MaxGrossWt,
      maxcargowt            as MaxCargoWt,
      ctarewt               as CTareWt,
      proformainvoiceno     as Proformainvoiceno,
      destinationcountry    as Destinationcountry,
      bookingno             as Bookingno,
      placereceipopre       as Placereceipopre,
      created_by            as CreatedBy,
      @Semantics.systemDateTime.createdAt: true
      created_at            as CreatedAt,
      last_changed_by       as LastChangedBy,
      @Semantics.systemDateTime.localInstanceLastChangedAt: true
      last_changed_at       as LastChangedAt,
      @Semantics.systemDateTime.lastChangedAt: true
      local_last_changed_at as LocalLastChangedAt

}
