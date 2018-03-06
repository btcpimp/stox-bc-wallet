#!/bin/bash
#
# pwd

echo installing global packages
npm install eslint eslint-config-airbnb-base eslint-plugin-import rimraf -g

common="${PWD##*/}-common"

cd "./common"
echo "installing common/"
if [ "$1" != "clean" ]
then
    rimraf node_modules/
fi
npm install
npm link
cd ..

for i in */
do
    if [ "$i" != "common/" ]
    then
        cd "./$i"
        echo "installing $i"
        if [ "$1" != "clean" ]
        then
            rimraf node_modules/
        fi
        npm install
        npm link $common
        cd ..
    fi
done