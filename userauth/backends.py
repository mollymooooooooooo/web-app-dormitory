from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging
logger = logging.getLogger(__name__)

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(
                Q(username__iexact=username) |
                Q(email__iexact=username)
            )
            
            if not user.check_password(password):
                logger.warning(f"Неверный пароль для пользователя {username}")
                return None
            if not user.is_active:
                logger.warning(f"Inactive user attempt: {username}")
                return None
            return user
        except User.DoesNotExist:
            logger.warning(f"Не найден пользователь {username}")
            return None
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            return None