import json
import boto3
import base64
import uuid
import os

s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        # Accede a los datos directamente desde el objeto JSON
        file_name = event['fileName']
        file_content = base64.b64decode(event['file'])
        full_name = event['fullName']
        
        # Obtiene el nombre del bucket desde las variables de entorno
        bucket_name = os.environ['BUCKET_NAME']
        
        # Realiza las operaciones necesarias con los datos
        # Subir el archivo a S3
        s3.put_object(
            Bucket= bucket_name,
            Key=file_name,
            Body=file_content,
            Metadata={
                'fullname': full_name
            }
        )
        
        # Retorna una respuesta adecuada si es necesario
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'File uploaded successfully', 'fileName': file_name})
        }
    except KeyError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Missing parameter: ' + str(e)})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': str(e)})
        }

    return {
        'statusCode': 500,
        'body': json.dumps({'message': event["fileName"]})
    }
