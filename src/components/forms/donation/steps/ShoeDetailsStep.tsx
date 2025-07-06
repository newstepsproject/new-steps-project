import { useFieldArray, useFormContext } from 'react-hook-form';
import { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  SHOE_BRANDS, 
  SHOE_SPORTS, 
  SHOE_CONDITION_OPTIONS, 
  SHOE_GENDER_OPTIONS,
  US_MEN_SIZES,
  US_WOMEN_SIZES,
  US_YOUTH_SIZES
} from '@/constants/config';
import { TrashIcon, PlusIcon } from 'lucide-react';
import { ShoeItem } from '@/types/common';

// Define a more complete type that includes all required fields for the multi-step form
interface DonationFormWithMethodData {
  donorInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isBayArea?: boolean;
  };
  shoeDetails: {
    shoes: Array<{
      brand: string;
      modelName: string;
      size: string;
      gender: string;
      condition: string;
      sport: string;
      color: string;
      description?: string;
      images?: string[];
    }>;
  };
  donationMethod: {
    method: 'dropoff' | 'pickup' | 'ship';
  };
  donationDescription: string;
  // Updated form fields for firstName/lastName
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ShoeDetailsStepProps {
  items: ShoeItem[];
  onItemsChange: (items: ShoeItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ShoeDetailsStep({ items, onItemsChange, onNext, onBack }: ShoeDetailsStepProps) {
  const {
    control,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<DonationFormWithMethodData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'shoeDetails.shoes',
  });

  const watchedShoeGenders = watch('shoeDetails.shoes');

  // Helper function to get size options based on gender
  const getSizeOptions = (gender: string) => {
    if (gender === 'men' || gender === 'unisex') return US_MEN_SIZES;
    if (gender === 'women') return US_WOMEN_SIZES;
    return US_YOUTH_SIZES; // boys or girls
  };

  // Sort sports and brands alphabetically
  const sortedSports = [...SHOE_SPORTS].sort((a, b) => a.localeCompare(b));
  const sortedBrands = [...SHOE_BRANDS].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <CardHeader>
        <CardTitle>Shoe Details</CardTitle>
        <CardDescription>
          Please provide details about the shoes you wish to donate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {fields.map((field, index) => (
            <div 
              key={field.id} 
              className="p-4 border rounded-lg bg-gray-50 relative"
            >
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}

              <h3 className="text-lg font-medium mb-4">Shoe {index + 1}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`brand-${index}`}>
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: { value },
                      } as unknown as React.ChangeEvent<HTMLSelectElement>;
                      register(`shoeDetails.shoes.${index}.brand`).onChange(event);
                    }}
                    defaultValue={field.brand}
                  >
                    <SelectTrigger id={`brand-${index}`}>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shoeDetails?.shoes?.[index]?.brand && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.brand?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`model-${index}`}>
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`model-${index}`}
                    {...register(`shoeDetails.shoes.${index}.modelName`)}
                    placeholder="Enter shoe model or style"
                  />
                  {errors.shoeDetails?.shoes?.[index]?.modelName && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.modelName?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`gender-${index}`}>
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: { value },
                      } as unknown as React.ChangeEvent<HTMLSelectElement>;
                      register(`shoeDetails.shoes.${index}.gender`).onChange(event);
                    }}
                    defaultValue={field.gender}
                  >
                    <SelectTrigger id={`gender-${index}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOE_GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shoeDetails?.shoes?.[index]?.gender && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.gender?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`size-${index}`}>
                    Size <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: { value },
                      } as unknown as React.ChangeEvent<HTMLSelectElement>;
                      register(`shoeDetails.shoes.${index}.size`).onChange(event);
                    }}
                    defaultValue={field.size}
                  >
                    <SelectTrigger id={`size-${index}`}>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {watchedShoeGenders?.[index]?.gender && 
                        getSizeOptions(watchedShoeGenders[index].gender).map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shoeDetails?.shoes?.[index]?.size && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.size?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`color-${index}`}>
                    Color <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`color-${index}`}
                    {...register(`shoeDetails.shoes.${index}.color`)}
                    placeholder="Enter shoe color"
                  />
                  {errors.shoeDetails?.shoes?.[index]?.color && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.color?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`sport-${index}`}>
                    Sport Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: { value },
                      } as unknown as React.ChangeEvent<HTMLSelectElement>;
                      register(`shoeDetails.shoes.${index}.sport`).onChange(event);
                    }}
                    defaultValue={field.sport}
                  >
                    <SelectTrigger id={`sport-${index}`}>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedSports.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shoeDetails?.shoes?.[index]?.sport && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.sport?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`condition-${index}`}>
                    Condition <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: { value },
                      } as unknown as React.ChangeEvent<HTMLSelectElement>;
                      register(`shoeDetails.shoes.${index}.condition`).onChange(event);
                    }}
                    defaultValue={field.condition}
                  >
                    <SelectTrigger id={`condition-${index}`}>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOE_CONDITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shoeDetails?.shoes?.[index]?.condition && (
                    <p className="text-sm text-red-500">
                      {errors.shoeDetails.shoes[index]?.condition?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>
                  Additional Description
                </Label>
                <Textarea
                  id={`description-${index}`}
                  {...register(`shoeDetails.shoes.${index}.description`)}
                  placeholder="Provide any additional details about the shoes"
                  className="h-20"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => 
              append({
                brand: '',
                modelName: '',
                size: '',
                gender: 'men',
                condition: 'good',
                sport: '',
                color: '',
                description: ''
              })
            }
            className="w-full flex items-center justify-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Another Pair
          </Button>
        </div>
      </CardContent>
    </>
  );
} 