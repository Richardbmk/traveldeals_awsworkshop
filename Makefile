bucket-policy:
	aws s3api put-bucket-policy --bucket traveldeals-23042021 --policy file://personalize-s3-bucket-policy.json

make-bucket:
	aws s3 mb s3://traveldeals-23042021

generate-personalize:
	node generate-personalize-datasets.js --userPoolId us-west-2_oM7dl5veW --dealTableName Deal-dmpnbrglkrellcpoh2xl7mytda-dev --awsRegion us-west-2 --number 5

cognito-users:
	node generate-cognito-users.js --baseEmail name@example.com --number 30

upload-to-bucket-1:
	aws s3 cp personalize-items.csv s3://traveldeals-23042021/item/

upload-to-bucket-2:
	aws s3 cp personalize-interactions.csv s3://traveldeals-23042021/user-item/

bucket-structure:
	aws s3 ls --recursive s3://traveldeals-23042021/

bucket-kinesis:
	aws s3 mb s3://traveldeals-24042021-kdf

bucket-athena:
	aws s3 mb s3://traveldeals-24042021-athena

checking-kinesis:
	aws s3 ls --recursive s3://traveldeals-24042021-kdf/




