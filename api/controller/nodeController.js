'use strict';
exports.read_a_task = function(req, res) {
    const fs = require('fs');
    const zip_to_cbsa = './data/zip_to_cbsa.csv';
    const cbsa_to_msa = './data/cbsa_to_msa.csv';
    const MSAString = 'Metropolitan Statistical Area';

    let ZipCodeArr =JSON.parse(req.query.zip) ;
    let cbsaArr = [];
    console.log(ZipCodeArr);

    function readFile(path, fn) {
    fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
            res.send(err);
        }
        fn(data) //callback function
        });
    }

    // get zip data
        readFile(zip_to_cbsa, function(data) {
            var zipFileDataLines = data.split("\r"),
                zipColsDict = {},
                zipCols;
            //get Zip and CBSA

            for (var i = 1; i < zipFileDataLines.length; i++) {
                zipCols = zipFileDataLines[i].split(",");
                zipColsDict[zipCols[0]] = zipCols[1]
            }

            for (var j =0;j<ZipCodeArr.length;j++){
                let zipCBSAObj = {};
                zipCBSAObj['Zip'] = ZipCodeArr[j];
                zipCBSAObj['CBSA'] = zipColsDict[ZipCodeArr[j]];
                cbsaArr.push(zipCBSAObj);
            }
            getMsaData(cbsaArr);

        });
    // get msa data
    function getMsaData(cbsaArr) {
        readFile(cbsa_to_msa, function (data) {
            var msaFileDataLines = data.split("\n"),
                msaColsArr = [], msaCols, mdivDict = {};

            let tempArr = [];
            for (let i = 5; i < msaFileDataLines.length; i++) {

                msaCols = msaFileDataLines[i].split(",");
                //create dict for cbsa
                tempArr = [];
                tempArr = [msaCols[0], msaCols[1], msaCols[3] + ", " + msaCols[4], msaCols[5], msaCols[12], msaCols[13]];
                msaColsArr.push(tempArr);

                // create dictionary for mdiv
                if(msaColsArr[1]!==''){
                    if(mdivDict.hasOwnProperty(msaCols[1])){
                        mdivDict[msaCols[1]].push(tempArr);
                    }
                    else{
                        mdivDict[msaCols[1]] = [tempArr];
                    }
                }
            }
        findMSA(cbsaArr, msaColsArr, mdivDict);

        })
    }

    function findMSA(cbsaArr, msaColsArr, mdivDict) {
        let cbsaDerived,
            cbsaDetail = [],
            selectedMSADetail = [];
        for (let i =0; i<cbsaArr.length; i++) {
            let cbsaOriginal = cbsaArr[i].CBSA,
                ZipValue = cbsaArr[i].Zip,
                selectedOuput = {};
            selectedOuput['Zip'] = ZipValue;
            console.log(`ZipValue: ${ZipValue}`);
            //if CBSA is in MDIV Dictionary
            if (mdivDict[cbsaOriginal] !== undefined) {
                cbsaDetail = mdivDict[cbsaOriginal];
                console.log(cbsaDetail);
                for (let d = 0; d < cbsaDetail.length; d++) {
                    if (cbsaDetail[d][3] === MSAString) {
                        selectedOuput['CBSA'] = cbsaDetail[d][0];
                        selectedOuput['MSA'] = cbsaDetail[d][2];
                        selectedOuput['Pop2015'] = cbsaDetail[d][5];
                        selectedOuput['Pop2014'] = cbsaDetail[d][4];
                        break;
                    }
                }
            } else{
            // if CBSA is not in MDIV
                for (let j = 0; j < msaColsArr.length; j++) {

                    cbsaDerived = cbsaOriginal;
                    selectedOuput['CBSA'] = cbsaOriginal;
                    if (msaColsArr[j][0] !== '' && cbsaOriginal === msaColsArr[j][0] && msaColsArr[j][3] === MSAString) {
                        selectedOuput['MSA'] = msaColsArr[j][2];
                        selectedOuput['Pop2015'] = msaColsArr[j][5];
                        selectedOuput['Pop2014'] = msaColsArr[j][4];
                        break;
                    }
                }
            }
            selectedMSADetail.push(selectedOuput);

        }
        res.json(selectedMSADetail);
    }
};
