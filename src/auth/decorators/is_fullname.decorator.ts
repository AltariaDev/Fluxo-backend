import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsFullName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFullName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          const fullnameRegex = /^[\p{L} .'-]+$/u;
          return typeof value === 'string' && fullnameRegex.test(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Fullname must only contain letters, spaces, dots, apostrophes, and dashes.';
        },
      },
    });
  };
}
