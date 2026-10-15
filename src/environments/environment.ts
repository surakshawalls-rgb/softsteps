export const environment: {
  production: boolean;
  supabase: {
    url: string;
    publishableKey: string;
  };
  adminMessaging: {
    provider: string;
    senderName: string;
    senderEmail: string;
    fromDomainVerified: boolean;
  };
} = {
  production: false,

  supabase: {
    url: 'https://quunysyiuzjuhytbcpon.supabase.co',
    publishableKey: 'sb_publishable_WZ9BRSlja7Ez00frqn0WHg_SzjxL51A',
  },

  adminMessaging: {
    provider: 'hostinger-smtp',
    senderName: 'Soft Steps Carpets & Rugs',
    senderEmail: 'info@softstepscarpets.com',
    fromDomainVerified: false,
  },
};
