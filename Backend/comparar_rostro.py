import json
import boto3
import base64
import os

rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        # Verificar si 'source_image' está presente en el evento
        if 'source_image' not in event:
            raise ValueError("Missing 'source_image' in event data")

        # Obtiene la imagen de origen en formato base64 de la solicitud
        source_image_base64 = event['source_image']
        
        # Decodifica la imagen base64 a bytes
        source_image_bytes = base64.b64decode(source_image_base64)
        
        # Obtiene el nombre del bucket desde las variables de entorno
        bucket_name = os.environ['BUCKET_NAME']
        
        # Obtiene la lista de objetos en el bucket de S3
        objects = s3.list_objects_v2(Bucket=bucket_name)
        
        # Itera sobre los objetos en el bucket
        for obj in objects.get('Contents', []):
            # Obtén el nombre del objeto actual
            target_image_name = obj['Key']
            
            # Realiza la comparación de caras utilizando Amazon Rekognition
            response = rekognition.compare_faces(
                SourceImage={
                    'Bytes': source_image_bytes
                },
                TargetImage={
                    'S3Object': {
                        'Bucket': bucket_name,
                        'Name': target_image_name
                    }
                }
            )
            
            # Verifica si se encontraron coincidencias
            if len(response['FaceMatches']) > 0:
                # Obtiene los metadatos del objeto de S3
                metadata = s3.head_object(Bucket=bucket_name, Key=target_image_name).get('Metadata', {})
                fullname = metadata.get('fullname', 'Unknown')
                
                # Si se encontraron coincidencias, devuelve los metadatos de la imagen encontrada
                matched_image_metadata = {
                    'matched_image_name': target_image_name,
                    'matched_image_confidence': response['FaceMatches'][0]['Similarity'],
                    'matched_image_fullname': fullname
                }
                return {
                    'statusCode': 200,
                    'body': json.dumps({'message': 'Match found', 'matched_image_metadata': matched_image_metadata})
                }
        
        # Si no se encontraron coincidencias, devuelve un mensaje indicando que no se encontró ninguna coincidencia
        return {
            'statusCode': 404,
            'body': json.dumps({'message': 'No match found'})
        }
    
    except Exception as e:
        # Maneja cualquier error que pueda ocurrir durante la ejecución
        return {
            'statusCode': 500,
            'body': json.dumps({'message': str(e)})
        }
