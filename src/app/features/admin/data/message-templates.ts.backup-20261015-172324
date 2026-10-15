export type CommunicationChannel = 'email' | 'whatsapp';

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
  supportedPlaceholders: string[];
}

export const BUSINESS_DETAILS = {
  businessName: 'Soft Steps Carpets & Rugs',
  businessEmail: 'info@softstepscarpets.com',
  businessPhone: '+91 70071 31072',
  website: 'https://www.softstepscarpets.com/',
  businessType: 'Carpet and rug manufacturer',
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'buyer-introduction',
    name: 'Buyer Introduction',
    description: 'A warm introduction to a prospective buyer or partner.',
    emailSubject: 'Introducing Soft Steps Carpets & Rugs',
    emailBody: `Dear {{buyerName}},

Thank you for your interest in Soft Steps Carpets & Rugs.

We are a premium carpet and rug manufacturer focused on handcrafted quality, custom manufacturing, and export-ready solutions for discerning buyers and design partners.

We would be delighted to learn more about your requirements and help you discover the right material, design, and finishing options for your project.

Warm regards,
{{senderName}}
{{senderEmail}}
{{website}}`,
    whatsappBody: `Hello {{buyerName}}! Thank you for your interest in Soft Steps Carpets & Rugs.

We are a premium carpet and rug manufacturer focused on handcrafted quality, custom manufacturing, and export-ready solutions for discerning buyers.

We would be delighted to learn more about your requirements and guide you with suitable options for your project.

Warm regards,
{{senderName}}`,
    supportedPlaceholders: ['{{buyerName}}', '{{senderName}}', '{{senderEmail}}', '{{website}}'],
  },
  {
    id: 'quotation-follow-up',
    name: 'Quotation Follow-up',
    description: 'Politely follow up on a previously shared quotation.',
    emailSubject: 'Following Up on Our Carpet Quotation',
    emailBody: `Dear {{buyerName}},

I hope you are doing well.

I wanted to follow up on the quotation we recently shared with you. I would appreciate hearing your feedback whenever convenient.

If you have any questions about the product specifications, design preferences, or custom requirements, our team would be happy to assist.

We look forward to hearing from you and would be pleased to explore the best fit for your project.

Warm regards,
{{senderName}}
{{senderEmail}}
{{website}}`,
    whatsappBody: `Hello {{buyerName}}! I hope you are doing well.

I wanted to follow up on the carpet quotation we recently shared. Have you had a chance to review it?

We would be happy to hear your feedback and discuss any questions or specifications you may have.

Looking forward to hearing from you.

Warm regards,
{{senderName}}`,
    supportedPlaceholders: ['{{buyerName}}', '{{senderName}}'],
  },
  {
    id: 'sample-follow-up',
    name: 'Sample Follow-up',
    description: 'Follow up after sending or discussing material and sample options.',
    emailSubject: 'Sample Review and Next Steps',
    emailBody: `Dear {{buyerName}},

Thank you for your time and interest in our collection.

I wanted to follow up regarding the sample options discussed for your project. We would be glad to continue supporting you with the most suitable material, design, and finishing combinations.

If you have any comments or would like us to share additional options, please let us know and we will be happy to assist.

We value the opportunity to work with you and look forward to the next step.

Warm regards,
{{senderName}}
{{senderEmail}}
{{website}}`,
    whatsappBody: `Hello {{buyerName}}! Thank you for your time and interest in our collection.

I wanted to follow up regarding the sample options discussed for your project. We would be glad to continue supporting you with the most suitable material, design, and finishing combinations.

If you have any comments or would like us to share more options, please let us know.

Warm regards,
{{senderName}}`,
    supportedPlaceholders: ['{{buyerName}}', '{{senderName}}'],
  },
  {
    id: 'product-enquiry-reply',
    name: 'Product Enquiry Reply',
    description: 'Respond to a product or range enquiry with a helpful summary.',
    emailSubject: 'Thank You for Your Enquiry About {{productName}}',
    emailBody: `Dear {{buyerName}},

Thank you for your enquiry regarding {{productName}}.

We appreciate the opportunity to assist and would be happy to share more information on the design, material, finish, and customization options available for your requirement.

Our team can also help assess suitability based on your project, quantity, and specification needs.

Please feel free to share any additional details, and we will be happy to support you further.

Warm regards,
{{senderName}}
{{senderEmail}}
{{website}}`,
    whatsappBody: `Hello {{buyerName}}! Thank you for your enquiry regarding {{productName}}.

We would be happy to share more details about the design, material, finish, and customization options available for your requirement.

Please feel free to share any additional details, and our team will be glad to assist.

Warm regards,
{{senderName}}`,
    supportedPlaceholders: ['{{buyerName}}', '{{productName}}', '{{senderName}}'],
  },
  {
    id: 'custom-order-discussion',
    name: 'Custom Order Discussion',
    description: 'Start a detailed conversation on bespoke manufacturing requirements.',
    emailSubject: 'Discussing Your Custom Carpet Requirements',
    emailBody: `Dear {{buyerName}},

Thank you for reaching out to discuss your custom rug or carpet requirement.

We understand the importance of detail in custom manufacturing and would be delighted to understand your preferences, design direction, and project goals.

Please feel free to share your specifications, reference images, quantity requirements, or any other details you would like us to consider. Our team will be glad to guide you through the available options and next steps.

We look forward to discussing your requirement in more detail.

Warm regards,
{{senderName}}
{{senderEmail}}
{{website}}`,
    whatsappBody: `Hello {{buyerName}}! Thank you for reaching out to discuss your custom carpet requirement.

We would be delighted to understand your preferences, design direction, and project goals.

Please feel free to share your specifications, reference images, quantity requirements, or any other details you would like us to consider.

We look forward to discussing your requirement in more detail.

Warm regards,
{{senderName}}`,
    supportedPlaceholders: ['{{buyerName}}', '{{senderName}}'],
  },
];
